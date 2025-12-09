import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType } from '@prisma/client';

export class DiscountDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiPropertyOptional({ type: String })
  code?: string | null;

  @ApiProperty({ enum: DiscountType })
  type!: DiscountType;

  @ApiProperty({ type: Number })
  value!: number;

  @ApiPropertyOptional({ type: [String], description: 'IDs of events this discount applies to.' })
  applicableEventIds?: string[];

  @ApiPropertyOptional({ type: Number })
  maxUses?: number | null;

  @ApiProperty({ type: Number })
  usedCount!: number;

  @ApiPropertyOptional({ type: Number })
  maxUsesPerUser?: number | null;

  @ApiPropertyOptional({ type: Number })
  minAmount?: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  startDate!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  endDate!: string;

  @ApiProperty({ type: Boolean })
  isActive!: boolean;

  @ApiProperty({ type: Boolean })
  isPublic!: boolean;
}
