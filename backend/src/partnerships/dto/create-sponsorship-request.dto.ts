import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { SponsorshipPlan } from '@prisma/client';
import {
  NormalizeIranianPhone,
  TrimOptionalText,
  TrimText,
} from './partnership-common';

export class CreateSponsorshipRequestDto {
  @ApiProperty({ example: 'شرکت نمونه' })
  @TrimText()
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  companyName!: string;

  @ApiProperty({ example: 'مریم رضایی' })
  @TrimText()
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  representativeName!: string;

  @ApiProperty({ example: 'partnership@example.com' })
  @TrimText()
  @IsEmail()
  @Length(3, 255)
  email!: string;

  @ApiProperty({ example: '۰۹۱۲۱۲۳۴۵۶۷' })
  @NormalizeIranianPhone()
  @IsString()
  @Matches(/^09\d{9}$/, {
    message: 'mobile must be a valid Iranian mobile number',
  })
  mobile!: string;

  @ApiProperty({ enum: SponsorshipPlan, example: SponsorshipPlan.GOLD })
  @IsEnum(SponsorshipPlan)
  plan!: SponsorshipPlan;

  @ApiPropertyOptional({ example: 'حمایت از رویدادهای آموزشی' })
  @TrimOptionalText()
  @IsOptional()
  @IsString()
  @Length(1, 5000)
  description?: string;
}
