import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PartnershipStatus, SponsorshipPlan } from '@prisma/client';

export class PartnershipQueryDto {
  @ApiPropertyOptional({ enum: PartnershipStatus })
  @IsOptional()
  @IsEnum(PartnershipStatus)
  status?: PartnershipStatus;

  @ApiPropertyOptional({ enum: SponsorshipPlan })
  @IsOptional()
  @IsEnum(SponsorshipPlan)
  plan?: SponsorshipPlan;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
