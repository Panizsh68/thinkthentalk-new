import { Currency, TicketType } from '@prisma/client';

export class EventTicketConfigEntity {
  constructor(
    public readonly id: string,
    public readonly type: TicketType,
    public readonly price: number,
    public readonly currency: Currency,
    public readonly quantityTotal: number,
    public readonly quantitySold: number,
    public readonly earlyBirdEndDate?: Date | null,
  ) {}
}
