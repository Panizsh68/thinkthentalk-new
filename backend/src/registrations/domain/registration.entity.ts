import { RegistrationStatus, TicketType } from '@prisma/client';
import { LocalizedText } from '../../events/utils/localized-text.helper';

export class RegistrationEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly eventId: string,
    public readonly ticketType: TicketType,
    public readonly status: RegistrationStatus,
    public readonly formData?: Record<string, any> | null,
    public readonly paymentId?: string | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}

export class UserRegistrationEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly eventId: string,
    public readonly paymentId: string | null,
    public readonly ticketType: TicketType,
    public readonly status: RegistrationStatus,
    public readonly createdAt: Date,
    public readonly event: { title: LocalizedText; startDateTime: Date },
  ) {}
}

export class UserRegistrationDetailsEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly eventId: string,
    public readonly paymentId: string | null,
    public readonly ticketType: TicketType,
    public readonly status: RegistrationStatus,
    public readonly createdAt: Date,
    public readonly user: any,
    public readonly formData: Record<string, any> | null,
    public readonly event: any,
    public readonly payment: any,
  ) {}
}
