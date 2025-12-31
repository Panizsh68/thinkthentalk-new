import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceAccessLevel } from '@prisma/client';
import { LocalizedTextDto } from './localized-text.dto';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EventResourceDto {
  @ApiProperty({ type: String })
  @IsString()
  id!: string;

  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  title!: LocalizedTextDto;

  @ApiProperty({ enum: ResourceAccessLevel })
  @IsEnum(ResourceAccessLevel)
  accessLevel!: ResourceAccessLevel;

  @ApiProperty({ type: String, format: 'uri' })
  @IsString()
  url!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  description?: string;
}
