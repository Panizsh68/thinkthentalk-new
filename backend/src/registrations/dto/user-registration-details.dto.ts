import { ApiProperty } from '@nestjs/swagger';
import { RegistrationStatus, TicketType } from '@prisma/client';
import { UserDto } from '../../users/dto/user.dto';
import { EventDto } from '../../events/dto/event.dto';
import { PaymentDto } from '../../payments/dto/payment.dto';
import { RegistrationFormDataDto } from './registration-form-data.dto';

export class UserRegistrationDetailsDto {
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

  @ApiProperty({ type: UserDto })
  user!: UserDto;

  @ApiProperty({ type: RegistrationFormDataDto })
  formData!: RegistrationFormDataDto;

  @ApiProperty({ type: EventDto })
  event!: EventDto;

  @ApiProperty({ type: PaymentDto })
  payment!: PaymentDto;
}
