import { ApiPropertyOptional } from '@nestjs/swagger';
import { RegistrationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RegistrationFormDataDto } from './registration-form-data.dto';

export class UpdateRegistrationDto {
  @ApiPropertyOptional({ enum: RegistrationStatus })
  @IsOptional()
  @IsEnum(RegistrationStatus)
  status?: RegistrationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentId?: string | null;

  @ApiPropertyOptional({ type: RegistrationFormDataDto })
  @IsOptional()
  formData?: RegistrationFormDataDto;
}
