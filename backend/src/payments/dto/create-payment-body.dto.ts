import { ApiProperty } from '@nestjs/swagger';
import { Currency, TicketType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RegistrationFormDataDto } from '../../registrations/dto/registration-form-data.dto';

export class CreatePaymentBodyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @ApiProperty({ enum: TicketType })
  @IsEnum(TicketType)
  ticketType!: TicketType;

  @ApiProperty({ type: Number })
  @IsNumber()
  amount!: number;

  @ApiProperty({ enum: Currency })
  @IsEnum(Currency)
  currency!: Currency;

  @ApiProperty({ type: RegistrationFormDataDto })
  @ValidateNested()
  @Type(() => RegistrationFormDataDto)
  formData!: RegistrationFormDataDto;
}
