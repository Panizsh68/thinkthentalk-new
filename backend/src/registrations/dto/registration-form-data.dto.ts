import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class RegistrationFormDataDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstNameFa!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastNameFa!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstNameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastNameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE', 'OTHER'] })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender?: 'MALE' | 'FEMALE' | 'OTHER';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mobile!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  educationLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fieldOfStudy?: string;

  @ApiProperty()
  @IsBoolean()
  isEmployed!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  languageLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referralSource?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referrerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  otherReferralSource?: string;

  @ApiProperty()
  @IsBoolean()
  acceptedRules!: boolean;
}
