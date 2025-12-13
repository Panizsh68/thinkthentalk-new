import { Currency, TicketType } from '@prisma/client';

export class EventTicketConfigEntity {
  constructor(
    public readonly id: string,
    public readonly type: TicketType,
    public readonly price: number,
    public readonly currency: Currency,
    public readonly quantityTotal: number,
    public readonly quantitySold: number,
    public readonly saleStartDate: Date,
    public readonly saleEndDate: Date,
    public readonly earlyBirdEndDate?: Date | null,
    public readonly quantityRemaining: number = Math.max(quantityTotal - quantitySold, 0),
  ) {}
}
