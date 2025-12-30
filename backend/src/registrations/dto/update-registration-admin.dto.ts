import { ApiPropertyOptional } from '@nestjs/swagger';
import { RegistrationStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { RegistrationFormDataDto } from './registration-form-data.dto';

export class UpdateRegistrationAdminDto {
  @ApiPropertyOptional({ enum: RegistrationStatus })
  @IsOptional()
  @IsEnum(RegistrationStatus)
  status?: RegistrationStatus;

  @ApiPropertyOptional({ type: RegistrationFormDataDto })
  @IsOptional()
  formData?: RegistrationFormDataDto;
}
