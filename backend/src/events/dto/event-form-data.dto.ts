import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LocalizedTextDto } from './localized-text.dto';

export class EventFormDataDto {
  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  title!: LocalizedTextDto;

  @ApiPropertyOptional({
    description: 'Optional custom slug (defaults to a normalized event title).',
    type: String,
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({
    description: 'Event categories as a comma-separated string.',
    type: String,
  })
  @IsString()
  categories!: string;

  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  summary!: LocalizedTextDto;

  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description!: LocalizedTextDto;

  @ApiProperty({ enum: EventType })
  @IsEnum(EventType)
  type!: EventType;

  @ApiPropertyOptional({ type: LocalizedTextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  city?: LocalizedTextDto;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsNotEmpty()
  @IsDateString()
  startDateTime!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  endDateTime?: string;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  capacityTotal!: number;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  showRemainingCapacity!: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  publicDiscountIds?: string[];

  @ApiPropertyOptional({ type: String, format: 'uri' })
  @IsOptional()
  @IsString()
  posterUrl?: string;
}
