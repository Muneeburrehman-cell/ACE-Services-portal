import { IsEmail, IsString, MinLength, IsDateString, IsOptional, IsNumber } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(2)
  clientCompanyName: string;

  @IsString()
  @MinLength(2)
  clientContactPerson: string;

  @IsOptional()
  @IsString()
  salespersonName?: string;

  @IsOptional()
  @IsNumber()
  decidedPrice?: number;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsEmail()
  clientEmail: string;

  @IsString()
  clientPhone: string;

  @IsString()
  @MinLength(5)
  scopeDescription: string;

  @IsDateString()
  requestedDeadline: string;

  @IsOptional()
  @IsString()
  projectType?: string;
}
