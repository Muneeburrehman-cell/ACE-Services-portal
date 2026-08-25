import { IsEnum, IsOptional, IsString, IsDateString, IsNumber } from 'class-validator';
import { ProjectStatus, PriorityLevel } from '@prisma/client';

export class UpdateProjectStatusDto {
  @IsEnum(ProjectStatus)
  status: ProjectStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @IsOptional()
  @IsString()
  followUpNotes?: string;

  @IsOptional()
  @IsNumber()
  decidedPrice?: number;
}

export class UpdateMerchantFeeDto {
  @IsOptional()
  @IsNumber()
  merchantFeePercent?: number;

  @IsOptional()
  @IsNumber()
  merchantFeeAmount?: number;
}
