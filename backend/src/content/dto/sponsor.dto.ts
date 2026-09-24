import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SponsorDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ type: String })
  productOrTagline!: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Absolute URL or canonical uploaded media path.',
  })
  logoUrl?: string | null;

  @ApiPropertyOptional({ type: String, format: 'uri' })
  websiteUrl?: string;
}
