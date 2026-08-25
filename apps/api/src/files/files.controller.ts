import {
  Controller, Post, Get, Delete, Body, Param,
  Query, UseGuards, Req, Res, Put, Header,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UploadUrlDto } from './dto/upload-url.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import * as fs from 'fs';
import * as path from 'path';
import type { Response, Request } from 'express';

const DEMO_UPLOAD_DIR = path.join(process.cwd(), 'demo-uploads');

@Controller('files')
export class FilesController {
  constructor(private files: FilesService) {}

  // ─── Authenticated endpoints ──────────────────────────────────────────

  @Post('upload-url')
  @UseGuards(JwtAuthGuard)
  getUploadUrl(@Body() dto: UploadUrlDto, @Req() req: any) {
    return this.files.getUploadUrl(dto, req.user);
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  confirmUpload(@Body() dto: ConfirmUploadDto, @Req() req: any) {
    return this.files.confirmUpload(dto, req.user);
  }

  @Get(':id/download-url')
  @UseGuards(JwtAuthGuard)
  getDownloadUrl(
    @Param('id') id: string,
    @Query('type') type: 'intake' | 'deliverable' = 'intake',
    @Req() req: any,
  ) {
    return this.files.getDownloadUrl(id, type, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteFile(
    @Param('id') id: string,
    @Query('type') type: 'intake' | 'deliverable' = 'intake',
  ) {
    return this.files.deleteFile(id, type);
  }

  // ─── Demo-mode endpoints (dev only, no auth required) ────────────────
  // These simulate S3 pre-signed upload/download for local development.
  // Blocked in production (NODE_ENV=production).

  @Put('demo-upload')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'PUT, OPTIONS')
  @Header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  demoUpload(@Query('key') key: string, @Req() req: Request, @Res() res: Response) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Not available in production' });
    }

    const safeName = (key ?? 'unknown').replace(/[/\\:*?"<>|]/g, '_');
    const filePath = path.join(DEMO_UPLOAD_DIR, safeName);

    try {
      fs.mkdirSync(DEMO_UPLOAD_DIR, { recursive: true });

      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      req.on('end', () => {
        try {
          const data = chunks.length > 0 ? Buffer.concat(chunks) : Buffer.from('[empty]');
          fs.writeFileSync(filePath, data);
          res.status(200).send('OK');
        } catch (err) {
          res.status(500).json({ message: 'Write failed' });
        }
      });
      req.on('error', () => res.status(500).json({ message: 'Stream error' }));
    } catch (err) {
      res.status(500).json({ message: 'Upload failed' });
    }
  }

  @Get('demo-download')
  demoDownload(
    @Query('key') key: string,
    @Query('name') name: string,
    @Res() res: Response,
  ) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Not available in production' });
    }

    const safeName = (key ?? 'unknown').replace(/[/\\:*?"<>|]/g, '_');
    const filePath = path.join(DEMO_UPLOAD_DIR, safeName);

    if (fs.existsSync(filePath)) {
      res.download(filePath, name ?? safeName);
    } else {
      res.status(404).json({ message: 'File not found in demo storage' });
    }
  }
}
