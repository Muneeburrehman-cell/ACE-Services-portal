import { IsString } from 'class-validator';

export class Verify2faDto {
  @IsString()
  pre2faToken: string;

  @IsString()
  totpCode: string;
}
