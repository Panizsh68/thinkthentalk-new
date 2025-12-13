import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, PaymentStatus, RegistrationStatus, TicketType } from '@prisma/client';
import { RegistrationFormDataDto } from '../../registrations/dto/registration-form-data.dto';

export class AdminUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  role!: string;
}

export class AdminUserProfileDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  mobile!: string;

  @ApiPropertyOptional()
  firstNameFa?: string;

  @ApiPropertyOptional()
  lastNameFa?: string;

  @ApiPropertyOptional()
  firstNameEn?: string | null;

  @ApiPropertyOptional()
  lastNameEn?: string | null;

  @ApiPropertyOptional({ enum: Gender })
  gender?: Gender | null;

  @ApiPropertyOptional()
  age?: number | null;

  @ApiPropertyOptional()
  educationLevel?: string | null;

  @ApiPropertyOptional()
  fieldOfStudy?: string | null;

  @ApiPropertyOptional()
  isEmployed?: boolean | null;

  @ApiPropertyOptional()
  jobTitle?: string | null;

  @ApiPropertyOptional()
  email?: string | null;

  @ApiPropertyOptional()
  languageLevel?: string | null;

  @ApiProperty()
  profileCompleted!: boolean;

  @ApiProperty({ type: [String] })
  missingFields!: string[];
}

export class AdminUserListItemDto extends AdminUserProfileDto {
  @ApiProperty()
  registrationCount!: number;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  lastRegistrationAt?: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;
}

export class AdminUserRegistrationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  eventId!: string;

  @ApiProperty()
  eventTitle!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  eventStartDateTime?: string;

  @ApiProperty({ enum: TicketType })
  ticketType!: TicketType;

  @ApiProperty({ enum: RegistrationStatus })
  status!: RegistrationStatus;

  @ApiPropertyOptional({ enum: PaymentStatus })
  paymentStatus?: PaymentStatus | null;

  @ApiPropertyOptional()
  paymentId?: string | null;

  @ApiPropertyOptional()
  paymentAmount?: number | null;

  @ApiPropertyOptional()
  gatewayTransactionId?: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiPropertyOptional({ type: RegistrationFormDataDto })
  formData?: RegistrationFormDataDto | null;
}

export class AdminUserDetailsDto {
  @ApiProperty({ type: AdminUserProfileDto })
  profile!: AdminUserProfileDto;

  @ApiProperty({ type: AdminUserRegistrationDto, isArray: true })
  registrations!: AdminUserRegistrationDto[];
}
