import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  ValidateIf,
} from 'class-validator';

const MEDIA_URL_PATTERN = /^(https?:\/\/\S+|\/\S+)$/;
const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class SponsorFormDataDto {
  @ApiProperty({ type: String })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ type: String })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  productOrTagline!: string;

  @ApiProperty({
    type: String,
    description: 'Absolute URL or canonical uploaded file path.',
  })
  @Transform(trimString)
  @Matches(MEDIA_URL_PATTERN)
  logoUrl!: string;

  @ApiPropertyOptional({ type: String, format: 'uri' })
  @Transform(trimString)
  @IsOptional()
  @ValidateIf((_object, value) => value !== '')
  @IsUrl()
  websiteUrl?: string;
}

export class UpdateSponsorFormDataDto {
  @ApiPropertyOptional({ type: String })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ type: String })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  productOrTagline?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Absolute URL or canonical uploaded file path.',
  })
  @Transform(trimString)
  @IsOptional()
  @ValidateIf((_object, value) => value !== '')
  @Matches(MEDIA_URL_PATTERN)
  logoUrl?: string;

  @ApiPropertyOptional({ type: String, format: 'uri' })
  @Transform(trimString)
  @IsOptional()
  @ValidateIf((_object, value) => value !== '')
  @IsUrl()
  websiteUrl?: string;
}
