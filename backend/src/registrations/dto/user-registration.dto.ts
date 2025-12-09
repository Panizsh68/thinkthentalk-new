import { ApiProperty } from '@nestjs/swagger';
import { RegistrationStatus, TicketType } from '@prisma/client';

export class UserRegistrationEventDto {
  @ApiProperty()
  title!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  startDateTime!: string;
}

export class UserRegistrationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  eventId!: string;

  @ApiProperty()
  paymentId!: string;

  @ApiProperty({ enum: TicketType })
  ticketType!: TicketType;

  @ApiProperty({ enum: RegistrationStatus })
  status!: RegistrationStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: UserRegistrationEventDto })
  event!: UserRegistrationEventDto;
}
