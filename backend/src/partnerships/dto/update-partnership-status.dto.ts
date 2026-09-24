import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { PartnershipStatus } from '@prisma/client';
import { TrimOptionalText } from './partnership-common';

export class UpdatePartnershipStatusDto {
  @ApiProperty({
    enum: PartnershipStatus,
    example: PartnershipStatus.REVIEWING,
  })
  @IsEnum(PartnershipStatus)
  status!: PartnershipStatus;

  @ApiPropertyOptional({
    description: 'Private note visible only to authorized administrators.',
  })
  @TrimOptionalText()
  @IsOptional()
  @IsString()
  @Length(1, 5000)
  notes?: string;
}
