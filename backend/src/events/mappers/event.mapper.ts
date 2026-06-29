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

export const prismaEventToEventEntity = (
  event: PrismaEvent & {
    ticketConfigs: PrismaEventTicketConfig[];
    resources: PrismaEventResource[];
  },
): EventEntity => {
  const categories = event.categories ? event.categories.split(',') : [];

  const publicDiscountIds = event.publicDiscountIds
    ? event.publicDiscountIds.split(',')
    : [];

  const tickets = event.ticketConfigs.map(
    (ticket) =>
      new EventTicketConfigEntity(
        ticket.id,
        ticket.type,
        typeof ticket.price === 'number'
          ? ticket.price
          : ticket.price.toNumber(),
        ticket.currency,
        ticket.quantityTotal,
        ticket.quantitySold,
        ticket.saleStartDate ?? event.startDateTime,
        ticket.saleEndDate ??
          event.endDateTime ??
          new Date(event.startDateTime.getTime() + 30 * 24 * 60 * 60 * 1000),
        ticket.earlyBirdEndDate,
        Math.max(ticket.quantityTotal - ticket.quantitySold, 0),
      ),
  );

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

  const summary = fromLegacyLocalizedText(event.summaryFa, event.summaryEn);
  const description = fromLegacyLocalizedText(
    event.descriptionFa,
    event.descriptionEn,
  );

  return new EventEntity(
    event.id,
    event.slug,
    parseLocalizedText(event.title),
    summary,
    description,
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
  title: { fa: entity.title.fa, en: entity.title.en },
  summary: { fa: entity.summary.fa, en: entity.summary.en },
  description: { fa: entity.description.fa, en: entity.description.en },
  type: entity.type,
  address: entity.address ?? null,
  city: entity.city ? { fa: entity.city.fa, en: entity.city.en } : null,
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
    title: { fa: r.title.fa, en: r.title.en },
    accessLevel: r.accessLevel,
    url: r.url,
    description: r.description ?? undefined,
  })),
  publicDiscountIds: entity.publicDiscountIds,
  posterUrl: entity.posterUrl ?? undefined,
  isArchived: entity.isArchived,
  archivedAt: entity.archivedAt ? entity.archivedAt.toISOString() : null,
  archivedById: entity.archivedById ?? null,
  deletedAt: entity.deletedAt ? entity.deletedAt.toISOString() : null,
  deletedById: entity.deletedById ?? null,
});

export const eventFormDataDtoToPrismaInput = (
  dto: EventFormDataDto,
): Prisma.EventCreateInput => {
  const categories = dto.categories
    ? dto.categories
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
    : [];

  return {
    title: serializeLocalizedText(dto.title),
    slug: dto.slug ?? '',
    summaryFa: dto.summary.fa,
    summaryEn: dto.summary.en ?? '',
    descriptionFa: dto.description.fa,
    descriptionEn: dto.description.en ?? '',
    type: dto.type,
    city: dto.city ? serializeLocalizedText(dto.city) : undefined,
    address: dto.address ?? undefined,
    startDateTime: new Date(dto.startDateTime),
    endDateTime: dto.endDateTime ? new Date(dto.endDateTime) : undefined,
    capacityTotal: dto.capacityTotal,
    capacityRemaining: dto.capacityTotal,
    showRemainingCapacity: dto.showRemainingCapacity,
    categories: categories.join(','),
    publicDiscountIds: (dto.publicDiscountIds ?? []).join(','),
    posterUrl: dto.posterUrl ?? undefined,
  };
};

export const eventUpdateFormDataDtoToPrismaInput = (
  dto: UpdateEventFormDataDto,
): Prisma.EventUpdateInput => {
  const categories =
    dto.categories !== undefined
      ? dto.categories
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
      : undefined;

  const updateInput: Prisma.EventUpdateInput = {
    ...(dto.title ? { title: serializeLocalizedText(dto.title) } : {}),
    ...(dto.slug ? { slug: dto.slug } : {}),
    ...(dto.summary
      ? {
          summaryFa: dto.summary.fa,
          summaryEn: dto.summary.en,
        }
      : {}),
    ...(dto.description
      ? {
          descriptionFa: dto.description.fa,
          descriptionEn: dto.description.en,
        }
      : {}),
    ...(dto.type !== undefined ? { type: dto.type } : {}),
    ...(dto.city !== undefined
      ? { city: dto.city ? serializeLocalizedText(dto.city) : null }
      : {}),
    ...(dto.address !== undefined ? { address: dto.address } : {}),
    ...(dto.startDateTime !== undefined
      ? { startDateTime: new Date(dto.startDateTime) }
      : {}),
    ...(dto.endDateTime !== undefined
      ? { endDateTime: new Date(dto.endDateTime) }
      : {}),
    ...(dto.capacityTotal !== undefined
      ? {
          capacityTotal: dto.capacityTotal,
          capacityRemaining: dto.capacityTotal,
        }
      : {}),
    ...(dto.showRemainingCapacity !== undefined
      ? { showRemainingCapacity: dto.showRemainingCapacity }
      : {}),
    ...(dto.posterUrl !== undefined ? { posterUrl: dto.posterUrl } : {}),
  };

  if (categories !== undefined) {
    updateInput.categories = categories.join(',');
  }

  if (dto.publicDiscountIds !== undefined) {
    updateInput.publicDiscountIds = dto.publicDiscountIds.join(',');
  }

  return updateInput;
};
