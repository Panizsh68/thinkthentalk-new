import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpResponseDto {
  @ApiProperty({ description: 'Indicates if the OTP was sent.', example: true })
  success!: boolean;
}
