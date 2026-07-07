import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Gender } from '@prisma/client';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({
    description: "User's first name in Persian.",
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstNameFa?: string;

  @ApiPropertyOptional({
    description: "User's last name in Persian.",
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastNameFa?: string;

  @ApiPropertyOptional({
    description: "User's first name in English.",
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstNameEn?: string;

  @ApiPropertyOptional({
    description: "User's last name in English.",
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastNameEn?: string;

  @ApiPropertyOptional({
    description: "User's gender.",
    enum: Gender,
    type: String,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: "User's age.", type: Number })
  @IsOptional()
  @IsInt()
  age?: number;

  @ApiPropertyOptional({ description: 'Education level.', type: String })
  @IsOptional()
  @IsString()
  educationLevel?: string;

  @ApiPropertyOptional({ description: 'Field of study.', type: String })
  @IsOptional()
  @IsString()
  fieldOfStudy?: string;

  @ApiPropertyOptional({ description: 'Employment status.', type: Boolean })
  @IsOptional()
  @IsBoolean()
  isEmployed?: boolean;

  @ApiPropertyOptional({ description: 'Job title.', type: String })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({
    description: 'Email address.',
    type: String,
    format: 'email',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description:
      'Mobile number. Accepted for frontend compatibility and ignored by this endpoint.',
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  mobile?: string;

  @ApiPropertyOptional({
    description: 'Language proficiency level.',
    type: String,
  })
  @IsOptional()
  @IsString()
  languageLevel?: string;

  @ApiPropertyOptional({
    description: "User's avatar image URL.",
    type: String,
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
