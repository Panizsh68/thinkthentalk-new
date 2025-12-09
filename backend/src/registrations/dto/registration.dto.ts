import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RegistrationStatus, TicketType } from '@prisma/client';

export class RegistrationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  eventId!: string;

  @ApiProperty({ enum: TicketType })
  ticketType!: TicketType;

  @ApiProperty({ enum: RegistrationStatus })
  status!: RegistrationStatus;

  @ApiPropertyOptional()
  paymentId?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}
