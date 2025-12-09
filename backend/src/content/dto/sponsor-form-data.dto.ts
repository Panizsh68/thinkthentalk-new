import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class SponsorFormDataDto {
  @ApiProperty({ type: String })
  @IsString()
  name!: string;

  @ApiProperty({ type: String })
  @IsString()
  productOrTagline!: string;

  @ApiProperty({ type: String, format: 'uri' })
  @IsUrl()
  logoUrl!: string;

  @ApiPropertyOptional({ type: String, format: 'uri' })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;
}

export class UpdateSponsorFormDataDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  productOrTagline?: string;

  @ApiPropertyOptional({ type: String, format: 'uri' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({ type: String, format: 'uri' })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;
}
