import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import {
  NormalizeIranianPhone,
  TrimOptionalText,
  TrimText,
} from './partnership-common';

export class CreateCollaborationRequestDto {
  @ApiProperty({ example: 'سارا' })
  @TrimText()
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  firstName!: string;

  @ApiProperty({ example: 'احمدی' })
  @TrimText()
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  lastName!: string;

  @ApiProperty({ example: 'sara@example.com' })
  @TrimText()
  @IsEmail()
  @Length(3, 255)
  email!: string;

  @ApiProperty({
    example: '۰۹۱۲۱۲۳۴۵۶۷',
    description:
      'Iranian mobile number; Persian and Arabic digits are accepted.',
  })
  @NormalizeIranianPhone()
  @IsString()
  @Matches(/^09\d{9}$/, {
    message: 'mobile must be a valid Iranian mobile number',
  })
  mobile!: string;

  @ApiProperty({ example: 'تولید محتوا' })
  @TrimText()
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  fieldOfExpertise!: string;

  @ApiPropertyOptional({ example: '۳ سال سابقه فعالیت رسانه‌ای' })
  @TrimOptionalText()
  @IsOptional()
  @IsString()
  @Length(1, 5000)
  experience?: string;

  @ApiProperty({ example: 'می‌خواهم در توسعه برنامه‌های آموزشی همکاری کنم.' })
  @TrimText()
  @IsString()
  @IsNotEmpty()
  @Length(1, 5000)
  whyJoin!: string;

  @ApiPropertyOptional({ example: 'پنجشنبه‌ها و جمعه‌ها' })
  @TrimOptionalText()
  @IsOptional()
  @IsString()
  @Length(1, 500)
  availability?: string;

  @ApiProperty({
    example: true,
    description: 'Must be true to submit a collaboration request.',
  })
  @IsBoolean()
  @Equals(true, { message: 'acceptedTerms must be true' })
  acceptedTerms!: true;
}
