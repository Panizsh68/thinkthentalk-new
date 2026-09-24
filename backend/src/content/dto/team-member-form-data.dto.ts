import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Min,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

const MEDIA_URL_PATTERN = /^(https?:\/\/\S+|\/\S+)$/;

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class TeamMemberFormDataDto {
  @ApiProperty({ type: String, description: 'Persian first name.' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  firstNameFa!: string;

  @ApiProperty({ type: String, description: 'Persian last name.' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  lastNameFa!: string;

  @ApiProperty({ type: String, description: 'Persian role/title.' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  roleFa!: string;

  @ApiProperty({ type: String, description: 'English first name.' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  firstNameEn!: string;

  @ApiProperty({ type: String, description: 'English last name.' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  lastNameEn!: string;

  @ApiProperty({ type: String, description: 'English role/title.' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  roleEn!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Absolute URL or canonical uploaded media path.',
  })
  @Transform(trimString)
  @IsOptional()
  @ValidateIf((_object, value) => value !== '')
  @Matches(MEDIA_URL_PATTERN, {
    message: 'avatarUrl must be an absolute URL or an uploaded file path',
  })
  avatarUrl?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Sort order in the team list.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTeamMemberFormDataDto {
  @ApiPropertyOptional({ type: String })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstNameFa?: string;

  @ApiPropertyOptional({ type: String })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastNameFa?: string;

  @ApiPropertyOptional({ type: String })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  roleFa?: string;

  @ApiPropertyOptional({ type: String })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstNameEn?: string;

  @ApiPropertyOptional({ type: String })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastNameEn?: string;

  @ApiPropertyOptional({ type: String })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  roleEn?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Absolute URL or canonical uploaded media path.',
  })
  @Transform(trimString)
  @IsOptional()
  @ValidateIf((_object, value) => value !== '')
  @Matches(MEDIA_URL_PATTERN, {
    message: 'avatarUrl must be an absolute URL or an uploaded file path',
  })
  avatarUrl?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Sort order in the team list.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ReorderTeamMembersDto {
  @ApiProperty({ type: String })
  @IsString()
  memberId!: string;

  @ApiProperty({ enum: ['up', 'down'] })
  @IsEnum(['up', 'down'] as const)
  direction!: 'up' | 'down';
}
