import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency, PaymentStatus, TicketType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class PaymentDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  registrationId!: string;

  @ApiProperty()
  @IsString()
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

  @ApiProperty({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  status!: PaymentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gatewayTransactionId?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}
