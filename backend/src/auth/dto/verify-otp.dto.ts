import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    example: '09123456789',
    description: "The user's 11-digit mobile number.",
  })
  @IsNotEmpty()
  @Matches(/^09\d{9}$/, {
    message: 'mobile must be an 11-digit Iranian mobile number starting with 09',
  })
  mobile!: string;

  @ApiProperty({
    example: '123456',
    description: 'The 6-digit one-time password.',
  })
  @IsNotEmpty()
  @Matches(/^\d{4,10}$/, { message: 'otp must be numeric' })
  otp!: string;
}
