import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class TestOtpQueryDto {
  @ApiProperty({
    description: 'Destination mobile number (e.g. 0912xxxxxxx or +98912xxxxxxx).',
    example: '09123456789',
  })
  @IsString()
  @Matches(/^\+?\d{10,15}$/, { message: 'mobile must be a valid phone number' })
  mobile!: string;

  @ApiPropertyOptional({
    description: 'Override OTP code; defaults to a random 6-digit value.',
    example: '654321',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4,10}$/, { message: 'otp must be numeric' })
  otp?: string;

  @ApiPropertyOptional({
    description: 'Override the IPPanel pattern code; defaults to config. Useful for testing multiple templates.',
    example: 'otp-pattern-code',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  patternCode?: string;
}
