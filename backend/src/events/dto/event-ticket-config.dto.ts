import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency, TicketType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class EventTicketConfigDto {
  @ApiProperty({ enum: TicketType })
  @IsEnum(TicketType)
  type!: TicketType;

  @ApiProperty({ type: Number })
  @IsNumber()
  price!: number;

  @ApiProperty({ enum: Currency })
  @IsEnum(Currency)
  currency!: Currency;

  @ApiProperty({ type: Number })
  @IsNumber()
  quantityTotal!: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  quantitySold!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  saleStartDate!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  saleEndDate!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsString()
  earlyBirdEndDate?: string | null;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  quantityRemaining?: number;
}
