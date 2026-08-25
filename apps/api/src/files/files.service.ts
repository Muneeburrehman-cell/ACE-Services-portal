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

const ALLOWED_EXTENSIONS = ['.pdf', '.dwg', '.dxf', '.png', '.jpg', '.jpeg', '.xlsx', '.docx', '.zip'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const STORAGE_DIR = path.join(process.cwd(), 'uploads');

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    // Initialize storage directory
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
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
    const storageKey = `projects/${dto.projectId}/${dto.fileType}/${fileId}-${safeName}`;

    // Local storage — return upload endpoint on the API server
    const apiBase = this.config.get('API_BASE_URL') ?? 'http://localhost:4000';
    const uploadUrl = `${apiBase}/api/files/upload?key=${encodeURIComponent(storageKey)}`;
    return { uploadUrl, storageKey, fileId };
  }

  async confirmUpload(
    dto: { projectId: string; storageKey: string; originalName: string; mimeType: string; sizeBytes: number; fileType: 'intake' | 'deliverable' },
    user: { sub: string; role: UserRole },
  ) {
    const localPath = path.join(STORAGE_DIR, dto.storageKey.replace(/\//g, '_'));
    if (!fs.existsSync(localPath)) {
      throw new BadRequestException('File not found in storage. Upload may have failed.');
    }

    if (dto.fileType === 'intake') {
      const file = await this.prisma.projectFile.create({
        data: { projectId: dto.projectId, originalName: dto.originalName, s3Key: dto.storageKey, mimeType: dto.mimeType, sizeBytes: BigInt(dto.sizeBytes) },
      });
      return { id: file.id, originalName: file.originalName };
    } else {
      const d = await this.prisma.deliverable.create({
        data: { projectId: dto.projectId, engineerId: user.sub, originalName: dto.originalName, s3Key: dto.storageKey, mimeType: dto.mimeType, sizeBytes: BigInt(dto.sizeBytes) },
      });
      return { id: d.id, originalName: d.originalName };
    }
  }

  async getDownloadUrl(fileId: string, fileType: 'intake' | 'deliverable', user: { sub: string; role: UserRole }) {
    let storageKey: string;

    if (fileType === 'intake') {
      const file = await this.prisma.projectFile.findUnique({ where: { id: fileId } });
      if (!file) throw new NotFoundException('File not found');
      storageKey = file.s3Key;
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
      storageKey = d.s3Key;
      if ((user.role === UserRole.ESTIMATION_ENGINEER || user.role === UserRole.DESIGN_ENGINEER) && d.engineerId !== user.sub) throw new ForbiddenException();
    }

    const apiBase = this.config.get('API_BASE_URL') ?? 'http://localhost:4000';
    return { url: `${apiBase}/api/files/download?key=${encodeURIComponent(storageKey)}` };
  }

  async deleteFile(fileId: string, fileType: 'intake' | 'deliverable') {
    if (fileType === 'intake') {
      const file = await this.prisma.projectFile.findUnique({ where: { id: fileId } });
      if (!file) throw new NotFoundException();
      const localPath = path.join(STORAGE_DIR, file.s3Key.replace(/\//g, '_'));
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
      await this.prisma.projectFile.delete({ where: { id: fileId } });
    } else {
      const d = await this.prisma.deliverable.findUnique({ where: { id: fileId } });
      if (!d) throw new NotFoundException();
      const localPath = path.join(STORAGE_DIR, d.s3Key.replace(/\//g, '_'));
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
      await this.prisma.deliverable.delete({ where: { id: fileId } });
    }
    return { success: true };
  }

  async getDeliverablesByProject(projectId: string) {
    return this.prisma.deliverable.findMany({ where: { projectId } });
  }

  async getSignedUrlForDelivery(storageKey: string): Promise<string> {
    const apiBase = this.config.get('API_BASE_URL') ?? 'http://localhost:4000';
    return `${apiBase}/api/files/download?key=${encodeURIComponent(storageKey)}`;
  }

  async getDeliverableStream(storageKey: string) {
    const localPath = path.join(STORAGE_DIR, storageKey.replace(/\//g, '_'));
    const { Readable } = await import('stream');
    if (fs.existsSync(localPath)) {
      return fs.createReadStream(localPath);
    }
    throw new NotFoundException('File not found in storage');
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
