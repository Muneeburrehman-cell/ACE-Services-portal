import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const ALLOWED_EXTENSIONS = ['.pdf', '.dwg', '.dxf', '.png', '.jpg', '.jpeg', '.xlsx', '.docx', '.zip'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const DEMO_UPLOAD_DIR = path.join(process.cwd(), 'demo-uploads');

@Injectable()
export class FilesService {
  private r2: S3Client;
  private bucket: string;
  private isDemo: boolean;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const accountId = config.get<string>('CF_ACCOUNT_ID') ?? '';
    const accessKeyId = config.get<string>('CF_R2_ACCESS_KEY_ID') ?? '';
    const secretAccessKey = config.get<string>('CF_R2_SECRET_ACCESS_KEY') ?? '';
    this.bucket = config.get<string>('CF_R2_BUCKET') ?? 'portal-files';

    // Demo mode: no real credentials configured
    this.isDemo = !accountId || accessKeyId === 'demo';

    if (!this.isDemo) {
      // Cloudflare R2 uses the AWS S3 SDK — just point to R2's S3-compatible endpoint
      this.r2 = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
    } else {
      // Demo fallback — local disk storage
      if (!fs.existsSync(DEMO_UPLOAD_DIR)) {
        fs.mkdirSync(DEMO_UPLOAD_DIR, { recursive: true });
      }
    }
  }

  async getUploadUrl(
    dto: { projectId: string; fileName: string; mimeType: string; sizeBytes: number; fileType: 'intake' | 'deliverable' },
    user: { sub: string; role: UserRole },
  ) {
    const ext = '.' + (dto.fileName.split('.').pop() ?? '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) throw new BadRequestException(`File type ${ext} is not allowed`);
    if (dto.sizeBytes > MAX_FILE_SIZE) throw new BadRequestException('File size exceeds 100 MB limit');
    await this.assertProjectAccess(dto.projectId, user, dto.fileType);

    const fileId = crypto.randomUUID();
    const safeName = dto.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const r2Key = `projects/${dto.projectId}/${dto.fileType}/${fileId}-${safeName}`;

    if (this.isDemo) {
      // Demo upload endpoint is on the API server (port 4000), NOT the frontend
      const apiBase = this.config.get('API_BASE_URL') ?? 'http://localhost:4000';
      const uploadUrl = `${apiBase}/api/files/demo-upload?key=${encodeURIComponent(r2Key)}`;
      return { uploadUrl, s3Key: r2Key, fileId, demo: true };
    }

    // R2 pre-signed PUT — identical API to S3
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: r2Key,
      ContentType: dto.mimeType,
      ContentLength: dto.sizeBytes,
    });
    const uploadUrl = await getSignedUrl(this.r2, command, { expiresIn: 60 });
    return { uploadUrl, s3Key: r2Key, fileId };
  }

  async confirmUpload(
    dto: { projectId: string; s3Key: string; originalName: string; mimeType: string; sizeBytes: number; fileType: 'intake' | 'deliverable' },
    user: { sub: string; role: UserRole },
  ) {
    if (!this.isDemo) {
      try {
        await this.r2.send(new HeadObjectCommand({ Bucket: this.bucket, Key: dto.s3Key }));
      } catch {
        throw new BadRequestException('File not found in storage. Upload may have failed.');
      }
    } else {
      const localPath = path.join(DEMO_UPLOAD_DIR, dto.s3Key.replace(/\//g, '_'));
      if (!fs.existsSync(localPath)) {
        fs.mkdirSync(path.dirname(localPath), { recursive: true });
        fs.writeFileSync(localPath, `[demo placeholder for ${dto.originalName}]`);
      }
    }

    if (dto.fileType === 'intake') {
      const file = await this.prisma.projectFile.create({
        data: { projectId: dto.projectId, originalName: dto.originalName, s3Key: dto.s3Key, mimeType: dto.mimeType, sizeBytes: BigInt(dto.sizeBytes) },
      });
      return { id: file.id, originalName: file.originalName };
    } else {
      const d = await this.prisma.deliverable.create({
        data: { projectId: dto.projectId, engineerId: user.sub, originalName: dto.originalName, s3Key: dto.s3Key, mimeType: dto.mimeType, sizeBytes: BigInt(dto.sizeBytes) },
      });
      return { id: d.id, originalName: d.originalName };
    }
  }

  async getDownloadUrl(fileId: string, fileType: 'intake' | 'deliverable', user: { sub: string; role: UserRole }) {
    let r2Key: string;

    if (fileType === 'intake') {
      const file = await this.prisma.projectFile.findUnique({ where: { id: fileId } });
      if (!file) throw new NotFoundException('File not found');
      r2Key = file.s3Key;
      const projectId = file.projectId;
      if (user.role === UserRole.BD_AGENT) {
        const p = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!p || p.bdAgentId !== user.sub) throw new ForbiddenException();
      } else if (user.role === UserRole.ESTIMATION_ENGINEER || user.role === UserRole.DESIGN_ENGINEER) {
        const p = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!p || p.assignedTo !== user.sub) throw new ForbiddenException();
      }
    } else {
      if (user.role === UserRole.BD_AGENT) throw new ForbiddenException();
      const d = await this.prisma.deliverable.findUnique({ where: { id: fileId } });
      if (!d) throw new NotFoundException('Deliverable not found');
      r2Key = d.s3Key;
      if ((user.role === UserRole.ESTIMATION_ENGINEER || user.role === UserRole.DESIGN_ENGINEER) && d.engineerId !== user.sub) throw new ForbiddenException();
    }

    if (this.isDemo) {
      return { url: `http://localhost:4000/api/files/demo-download?key=${encodeURIComponent(r2Key)}&name=${encodeURIComponent(r2Key.split('/').pop() ?? 'file')}`, demo: true };
    }

    const command = new GetObjectCommand({ Bucket: this.bucket, Key: r2Key });
    const url = await getSignedUrl(this.r2, command, { expiresIn: 3600 }); // 60 min
    return { url };
  }

  async deleteFile(fileId: string, fileType: 'intake' | 'deliverable') {
    if (fileType === 'intake') {
      const file = await this.prisma.projectFile.findUnique({ where: { id: fileId } });
      if (!file) throw new NotFoundException();
      if (!this.isDemo) await this.r2.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: file.s3Key }));
      await this.prisma.projectFile.delete({ where: { id: fileId } });
    } else {
      const d = await this.prisma.deliverable.findUnique({ where: { id: fileId } });
      if (!d) throw new NotFoundException();
      if (!this.isDemo) await this.r2.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: d.s3Key }));
      await this.prisma.deliverable.delete({ where: { id: fileId } });
    }
    return { success: true };
  }

  async getDeliverablesByProject(projectId: string) {
    return this.prisma.deliverable.findMany({ where: { projectId } });
  }

  async getSignedUrlForDelivery(r2Key: string, expiresIn: number): Promise<string> {
    if (this.isDemo) {
      return `http://localhost:4000/api/files/demo-download?key=${encodeURIComponent(r2Key)}`;
    }
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: r2Key });
    return getSignedUrl(this.r2, command, { expiresIn });
  }

  async getDeliverableStream(r2Key: string) {
    if (this.isDemo) {
      const localPath = path.join(DEMO_UPLOAD_DIR, r2Key.replace(/\//g, '_'));
      const { Readable } = await import('stream');
      if (fs.existsSync(localPath)) return fs.createReadStream(localPath);
      return Readable.from([`[Demo file content for ${r2Key}]`]);
    }
    const response = await this.r2.send(new GetObjectCommand({ Bucket: this.bucket, Key: r2Key }));
    return response.Body;
  }

  private async assertProjectAccess(projectId: string, user: { sub: string; role: UserRole }, fileType: 'intake' | 'deliverable') {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (user.role === UserRole.BD_AGENT) {
      if (fileType !== 'intake') throw new ForbiddenException();
      if (project.bdAgentId !== user.sub) throw new ForbiddenException();
    } else if (user.role === UserRole.ESTIMATION_ENGINEER || user.role === UserRole.DESIGN_ENGINEER) {
      if (project.assignedTo !== user.sub) throw new ForbiddenException();
    }
  }
}
