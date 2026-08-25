import { IsIn, IsNumber, IsString, IsUUID, Max, Min } from 'class-validator';

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export class ConfirmUploadDto {
  @IsUUID()
  projectId: string;

  @IsString()
  storageKey: string;

  @IsString()
  originalName: string;

  @IsString()
  mimeType: string;

  @IsNumber()
  @Min(1)
  @Max(MAX_FILE_SIZE)
  sizeBytes: number;

  @IsIn(['intake', 'deliverable'])
  fileType: 'intake' | 'deliverable';
}
