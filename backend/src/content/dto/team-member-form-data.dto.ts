import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  Min,
  IsString,
  Matches,
} from 'class-validator';

const MEDIA_URL_PATTERN = /^(https?:\/\/\S+|\/\S+)$/;

export class TeamMemberFormDataDto {
  @ApiProperty({ type: String })
  @IsString()
  name!: string;

  @ApiProperty({ type: String })
  @IsString()
  role!: string;

  @ApiProperty({ type: String, format: 'uri' })
  @Matches(MEDIA_URL_PATTERN, {
    message: 'photoUrl must be an absolute URL or an uploaded file path',
  })
  photoUrl!: string;

  @ApiPropertyOptional({ type: Number, description: 'Sort order in the team list.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
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
  @Matches(MEDIA_URL_PATTERN, {
    message: 'photoUrl must be an absolute URL or an uploaded file path',
  })
  photoUrl?: string;

  @ApiPropertyOptional({ type: Number, description: 'Sort order in the team list.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class ReorderTeamMembersDto {
  @ApiProperty({ type: String })
  @IsString()
  memberId!: string;

  @ApiProperty({ enum: ['up', 'down'] })
  @IsIn(['up', 'down'])
  direction!: 'up' | 'down';
}
