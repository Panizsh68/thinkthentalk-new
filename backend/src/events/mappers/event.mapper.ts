import {
  Event as PrismaEvent,
  EventResource as PrismaEventResource,
  EventTicketConfig as PrismaEventTicketConfig,
  Prisma,
} from '@prisma/client';
import { EventEntity } from '../domain/event.entity';
import { EventResourceEntity } from '../domain/event-resource.entity';
import { EventTicketConfigEntity } from '../domain/event-ticket-config.entity';
import { EventDto } from '../dto/event.dto';
import { EventFormDataDto } from '../dto/event-form-data.dto';
import { UpdateEventFormDataDto } from '../dto/event-update-form-data.dto';
import {
  fromLegacyLocalizedText,
  parseLocalizedText,
  serializeLocalizedText,
} from '../utils/localized-text.helper';

/**
 * Parses a string field that might be stored as a JSON array or a CSV string.
 */
const parseArrayField = (input?: string | null): string[] => {
  if (!input) return [];
  const trimmed = input.trim();
  if (!trimmed) return [];

  // Try parsing as JSON first (standard for modern MariaDB/Prisma arrays)
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // Fall through to CSV split
    }
  }

  // Fallback to CSV split for legacy data
  return trimmed
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

/**
 * Serializes an array or CSV string into a valid JSON array string to satisfy MariaDB JSON_VALID constraints.
 */
const serializeArrayField = (input?: string | string[] | null, defaultValue = 'General'): string => {
  let items: string[] = [];

  if (Array.isArray(input)) {
    items = input;
  } else if (typeof input === 'string') {
    items = input.split(',').map((s) => s.trim());
  }

  const cleaned = items.filter(Boolean);
  const finalItems = cleaned.length > 0 ? cleaned : [defaultValue];
  
  return JSON.stringify(finalItems);
};

export const prismaEventToEventEntity = (
  event: PrismaEvent & {
    ticketConfigs: (PrismaEventTicketConfig & {
      saleStartDate?: Date | null;
      saleEndDate?: Date | null;
    })[];
    resources: PrismaEventResource[];
  },
): EventEntity => {
  const categories = parseArrayField(event.categories);
  const publicDiscountIds = parseArrayField(event.publicDiscountIds);

  const tickets = event.ticketConfigs.map((ticket) => {
    const price =
      typeof ticket.price === 'number'
        ? ticket.price
        : (ticket.price as any).toNumber();
    return new EventTicketConfigEntity(
      ticket.id,
      ticket.type,
      price,
      ticket.currency,
      ticket.quantityTotal,
      ticket.quantitySold,
      ticket.saleStartDate || event.startDateTime,
      ticket.saleEndDate ||
        event.endDateTime ||
        new Date(event.startDateTime.getTime() + 30 * 24 * 60 * 60 * 1000),
      ticket.earlyBirdEndDate,
      Math.max(ticket.quantityTotal - ticket.quantitySold, 0),
    );
  });

  const resources = event.resources.map(
    (res) =>
      new EventResourceEntity(
        res.id,
        { fa: res.titleFa, en: res.titleEn },
        res.accessLevel,
        res.url,
        res.description,
      ),
  );

  return new EventEntity(
    event.id,
    event.slug,
    parseLocalizedText(event.title),
    fromLegacyLocalizedText(event.summaryFa, event.summaryEn),
    fromLegacyLocalizedText(event.descriptionFa, event.descriptionEn),
    event.type,
    event.startDateTime,
    event.endDateTime,
    event.capacityTotal,
    event.capacityRemaining,
    event.showRemainingCapacity,
    categories,
    tickets,
    resources,
    publicDiscountIds,
    event.city ? parseLocalizedText(event.city) : null,
    event.address,
    event.posterUrl,
    event.isArchived,
    event.archivedAt,
    event.archivedById,
    event.deletedAt,
    event.deletedById,
  );
};

export const eventEntityToEventDto = (entity: EventEntity): EventDto => ({
  id: entity.id,
  slug: entity.slug,
  title: entity.title,
  summary: entity.summary,
  description: entity.description,
  type: entity.type,
  address: entity.address || null,
  city: entity.city || null,
  startDateTime: entity.startDateTime.toISOString(),
  endDateTime: entity.endDateTime ? entity.endDateTime.toISOString() : null,
  capacityTotal: entity.capacityTotal,
  capacityRemaining: entity.capacityRemaining,
  showRemainingCapacity: entity.showRemainingCapacity,
  categories: entity.categories,
  tickets: entity.tickets.map((t) => ({
    type: t.type,
    price: t.price,
    currency: t.currency,
    quantityTotal: t.quantityTotal,
    quantitySold: t.quantitySold,
    quantityRemaining: t.quantityRemaining,
    saleStartDate: t.saleStartDate.toISOString(),
    saleEndDate: t.saleEndDate.toISOString(),
    earlyBirdEndDate: t.earlyBirdEndDate
      ? t.earlyBirdEndDate.toISOString()
      : null,
  })),
  resources: entity.resources.map((r) => ({
    id: r.id,
    title: r.title,
    accessLevel: r.accessLevel,
    url: r.url,
    description: r.description || undefined,
  })),
  publicDiscountIds: entity.publicDiscountIds,
  posterUrl: entity.posterUrl || undefined,
  isArchived: entity.isArchived,
  archivedAt: entity.archivedAt ? entity.archivedAt.toISOString() : null,
  archivedById: entity.archivedById || null,
  deletedAt: entity.deletedAt ? entity.deletedAt.toISOString() : null,
  deletedById: entity.deletedById || null,
});

export const eventFormDataDtoToPrismaInput = (
  dto: EventFormDataDto,
): Prisma.EventCreateInput => ({
  title: serializeLocalizedText(dto.title),
  slug: dto.slug || '',
  summaryFa: dto.summary.fa,
  summaryEn: dto.summary.en || '',
  descriptionFa: dto.description.fa,
  descriptionEn: dto.description.en || '',
  type: dto.type,
  city: dto.city ? serializeLocalizedText(dto.city) : undefined,
  address: dto.address || undefined,
  startDateTime: new Date(dto.startDateTime),
  endDateTime: dto.endDateTime ? new Date(dto.endDateTime) : undefined,
  capacityTotal: dto.capacityTotal,
  capacityRemaining: dto.capacityTotal,
  showRemainingCapacity: dto.showRemainingCapacity,
  categories: serializeArrayField(dto.categories),
  publicDiscountIds: serializeArrayField(dto.publicDiscountIds, ''),
  posterUrl: dto.posterUrl || undefined,
});

export const eventUpdateFormDataDtoToPrismaInput = (
  dto: UpdateEventFormDataDto,
): Prisma.EventUpdateInput => {
  const updateInput: Prisma.EventUpdateInput = {};

  if (dto.title) updateInput.title = serializeLocalizedText(dto.title);
  if (dto.slug !== undefined) updateInput.slug = dto.slug;
  if (dto.summary) {
    updateInput.summaryFa = dto.summary.fa;
    updateInput.summaryEn = dto.summary.en;
  }
  if (dto.description) {
    updateInput.descriptionFa = dto.description.fa;
    updateInput.descriptionEn = dto.description.en;
  }
  if (dto.type !== undefined) updateInput.type = dto.type;
  if (dto.city !== undefined)
    updateInput.city = dto.city ? serializeLocalizedText(dto.city) : null;
  if (dto.address !== undefined) updateInput.address = dto.address;
  if (dto.startDateTime !== undefined)
    updateInput.startDateTime = new Date(dto.startDateTime);
  if (dto.endDateTime !== undefined)
    updateInput.endDateTime = dto.endDateTime
      ? new Date(dto.endDateTime)
      : null;
  if (dto.capacityTotal !== undefined) {
    updateInput.capacityTotal = dto.capacityTotal;
    updateInput.capacityRemaining = dto.capacityTotal;
  }
  if (dto.showRemainingCapacity !== undefined)
    updateInput.showRemainingCapacity = dto.showRemainingCapacity;
  if (dto.posterUrl !== undefined) updateInput.posterUrl = dto.posterUrl;
  
  if (dto.categories !== undefined) {
    updateInput.categories = serializeArrayField(dto.categories);
  }
  if (dto.publicDiscountIds !== undefined) {
    updateInput.publicDiscountIds = serializeArrayField(dto.publicDiscountIds, '');
  }

  return updateInput;
};