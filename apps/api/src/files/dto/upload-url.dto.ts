import { IsIn, IsNumber, IsString, IsUUID, Max, Min } from 'class-validator';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export class UploadUrlDto {
  @IsUUID()
  projectId: string;

  @IsString()
  fileName: string;

  @IsString()
  mimeType: string;

  @IsNumber()
  @Min(1)
  @Max(MAX_FILE_SIZE)
  sizeBytes: number;

  @IsIn(['intake', 'deliverable'])
  fileType: 'intake' | 'deliverable';
}
