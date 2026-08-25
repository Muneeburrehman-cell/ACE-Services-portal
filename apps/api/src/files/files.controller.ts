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

const STORAGE_DIR = path.join(process.cwd(), 'uploads');

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

  // ─── Local storage endpoints ──────────────────────────────────────────
  // Handle file uploads and downloads from local disk storage

  @Put('upload')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'PUT, OPTIONS')
  @Header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  async upload(@Query('key') key: string, @Req() req: Request, @Res() res: Response) {
    const safeName = (key ?? 'unknown').replace(/[/\\:*?"<>|]/g, '_');
    const filePath = path.join(STORAGE_DIR, safeName);

    try {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });

      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      req.on('end', () => {
        try {
          const data = chunks.length > 0 ? Buffer.concat(chunks) : Buffer.from('[empty]');
          fs.writeFileSync(filePath, data);
          res.status(200).json({ success: true });
        } catch (err) {
          res.status(500).json({ message: 'Write failed' });
        }
      });
      req.on('error', () => res.status(500).json({ message: 'Stream error' }));
    } catch (err) {
      res.status(500).json({ message: 'Upload failed' });
    }
  }

  @Get('download')
  async download(
    @Query('key') key: string,
    @Res() res: Response,
  ) {
    const safeName = (key ?? 'unknown').replace(/[/\\:*?"<>|]/g, '_');
    const filePath = path.join(STORAGE_DIR, safeName);

    if (fs.existsSync(filePath)) {
      res.download(filePath, safeName);
    } else {
      res.status(404).json({ message: 'File not found in storage' });
    }
  }
}
