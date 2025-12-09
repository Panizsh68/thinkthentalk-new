import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType } from '@prisma/client';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsNumber } from 'class-validator';

export class DiscountFormDataDto {
  @ApiProperty({ type: String })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ enum: DiscountType })
  @IsEnum(DiscountType)
  type!: DiscountType;

  @ApiProperty({ type: Number })
  @IsNumber()
  value!: number;

  @ApiPropertyOptional({ type: [String], description: 'Event IDs this discount applies to.' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableEventIds?: string[];

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsInt()
  maxUses?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsInt()
  maxUsesPerUser?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  minAmount?: number;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  endDate!: string;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  isActive!: boolean;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  isPublic!: boolean;
}

export class UpdateDiscountFormDataDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ enum: DiscountType })
  @IsOptional()
  @IsEnum(DiscountType)
  type?: DiscountType;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiPropertyOptional({ type: [String], description: 'Event IDs this discount applies to.' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableEventIds?: string[];

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsInt()
  maxUses?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsInt()
  maxUsesPerUser?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  minAmount?: number;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
