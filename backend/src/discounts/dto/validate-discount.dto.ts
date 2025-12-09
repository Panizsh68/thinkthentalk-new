import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class ValidateDiscountDto {
  @ApiProperty({ type: String, description: 'The discount code to validate.' })
  @IsString()
  code!: string;

  @ApiProperty({ type: String, description: 'The ID of the event the code is being applied to.' })
  @IsString()
  eventId!: string;

  @ApiProperty({ type: Number, description: 'The original ticket price before discount.' })
  @IsNumber()
  ticketPrice!: number;
}
