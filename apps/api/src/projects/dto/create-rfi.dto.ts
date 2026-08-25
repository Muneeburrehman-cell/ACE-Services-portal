import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateRfiDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @MinLength(5)
  question: string;

  @IsOptional()
  @IsString()
  attachmentName?: string;

  @IsOptional()
  @IsString()
  attachmentS3Key?: string;
}

export class AnswerRfiDto {
  @IsString()
  @MinLength(1)
  adminAnswer: string;
}
