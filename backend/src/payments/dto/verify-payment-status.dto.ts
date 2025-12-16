import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class VerifyPaymentStatusDto {
  @ApiProperty({
    enum: ['SUCCESS', 'FAILED'],
    description: 'Final status returned from the payment gateway.',
  })
  @IsEnum(['SUCCESS', 'FAILED'])
  status!: 'SUCCESS' | 'FAILED';
}
