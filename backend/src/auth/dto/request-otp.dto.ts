import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({
    description: "The user's 11-digit mobile number.",
    example: '09123456789',
  })
  @IsNotEmpty()
  @Matches(/^09\d{9}$/, {
    message:
      'mobile must be an 11-digit Iranian mobile number starting with 09',
  })
  mobile!: string;
}
