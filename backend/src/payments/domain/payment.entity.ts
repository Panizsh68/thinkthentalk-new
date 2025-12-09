import { Currency, PaymentStatus, TicketType } from '@prisma/client';

export class PaymentEntity {
  constructor(
    public readonly id: string,
    public readonly registrationId: string,
    public readonly eventId: string,
    public readonly ticketType: TicketType,
    public readonly amount: number,
    public readonly currency: Currency,
    public readonly status: PaymentStatus,
    public readonly gatewayTransactionId?: string | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
