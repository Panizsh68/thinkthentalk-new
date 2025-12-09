import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class UserDto {
  @ApiProperty({ description: 'The unique identifier for the user.', type: String })
  @IsString()
  id!: string;

  @ApiProperty({ description: "User's first name in Persian.", type: String })
  @IsString()
  firstNameFa!: string;

  @ApiProperty({ description: "User's last name in Persian.", type: String })
  @IsString()
  lastNameFa!: string;

  @ApiPropertyOptional({ description: "User's first name in English.", type: String })
  @IsOptional()
  @IsString()
  firstNameEn?: string | null;

  @ApiPropertyOptional({ description: "User's last name in English.", type: String })
  @IsOptional()
  @IsString()
  lastNameEn?: string | null;

  @ApiPropertyOptional({
    description: "User's gender.",
    enum: ['MALE', 'FEMALE', 'OTHER'],
  })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender?: string | null;

  @ApiPropertyOptional({ description: "User's age.", type: Number })
  @IsOptional()
  @IsInt()
  age?: number | null;

  @ApiPropertyOptional({ description: 'Education level.', type: String })
  @IsOptional()
  @IsString()
  educationLevel?: string | null;

  @ApiPropertyOptional({ description: 'Field of study.', type: String })
  @IsOptional()
  @IsString()
  fieldOfStudy?: string | null;

  @ApiPropertyOptional({ description: 'Employment status.', type: Boolean })
  @IsOptional()
  @IsBoolean()
  isEmployed?: boolean | null;

  @ApiPropertyOptional({ description: 'Job title.', type: String })
  @IsOptional()
  @IsString()
  jobTitle?: string | null;

  @ApiProperty({ description: "The user's primary mobile number (unique).", type: String })
  @IsString()
  mobile!: string;

  @ApiPropertyOptional({ description: 'Email address.', type: String })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({ description: 'Language proficiency level.', type: String })
  @IsOptional()
  @IsString()
  languageLevel?: string | null;

  @ApiPropertyOptional({ description: "User's avatar image URL.", type: String })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;
}
