import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class TeamMemberFormDataDto {
  @ApiProperty({ type: String })
  @IsString()
  name!: string;

  @ApiProperty({ type: String })
  @IsString()
  role!: string;

  @ApiProperty({ type: String, format: 'uri' })
  @IsUrl()
  photoUrl!: string;
}

export class UpdateTeamMemberFormDataDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ type: String, format: 'uri' })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;
}
