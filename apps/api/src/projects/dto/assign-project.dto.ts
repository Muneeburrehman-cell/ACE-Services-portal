import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PriorityLevel } from '@prisma/client';

export class AssignProjectDto {
  @IsUUID()
  engineerId: string;

  @IsDateString()
  internalDeadline: string;

  @IsEnum(PriorityLevel)
  priority: PriorityLevel;

  @IsOptional()
  @IsString()
  adminInstructions?: string;

  @IsOptional()
  @IsString()
  projectType?: string; // 'estimation' | 'design'
}
