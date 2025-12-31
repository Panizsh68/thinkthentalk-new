import { EventType } from '@prisma/client';
import { EventResourceEntity } from './event-resource.entity';
import { EventTicketConfigEntity } from './event-ticket-config.entity';
import { LocalizedText } from '../utils/localized-text.helper';

export class EventEntity {
  constructor(
    public readonly id: string,
    public readonly slug: string,
    public readonly title: LocalizedText,
    public readonly summary: LocalizedText,
    public readonly description: LocalizedText,
    public readonly type: EventType,
    public readonly startDateTime: Date,
    public readonly endDateTime: Date | null,
    public readonly capacityTotal: number,
    public readonly capacityRemaining: number,
    public readonly showRemainingCapacity: boolean,
    public readonly categories: string[],
    public readonly tickets: EventTicketConfigEntity[],
    public readonly resources: EventResourceEntity[],
    public readonly publicDiscountIds: string[],
    public readonly city?: LocalizedText | null,
    public readonly address?: string | null,
    public readonly posterUrl?: string | null,
    public readonly isArchived = false,
    public readonly archivedAt: Date | null = null,
    public readonly archivedById?: string | null,
    public readonly deletedAt: Date | null = null,
    public readonly deletedById?: string | null,
  ) {}
}
