import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'A human-readable error message.',
    example: 'Invalid OTP.',
  })
  message!: string;
}
