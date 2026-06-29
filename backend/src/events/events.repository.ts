import { Injectable, Logger } from '@nestjs/common';
import {
  Event as PrismaEvent,
  Prisma,
  EventType,
  EventTicketConfig as PrismaEventTicketConfig,
} from '@prisma/client';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { EventEntity } from './domain/event.entity';
import { EventTicketConfigDto } from './dto/event-ticket-config.dto';
import { EventResourceDto } from './dto/event-resource.dto';
import { EventFormDataDto } from './dto/event-form-data.dto';
import {
  eventFormDataDtoToPrismaInput,
  eventUpdateFormDataDtoToPrismaInput,
  prismaEventToEventEntity,
} from './mappers/event.mapper';
import { UpdateEventFormDataDto } from './dto/event-update-form-data.dto';
import { getTicketSaleWindows } from './utils/ticket-sale-window.helper';

export interface EventsFilter {
  showPastEvents?: boolean;
  type?: EventType;
  city?: string;
  category?: string;
  categories?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  status?: 'upcoming' | 'past' | 'all';
  limit?: number;
  sortBy?: 'startDateTime' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  archived?: 'all' | 'true' | 'false';
  deleted?: 'all' | 'true' | 'false';
}

export interface AdminEventsFilter extends EventsFilter {
  page?: number;
}

@Injectable()
export class EventsRepository {
  private readonly logger = new Logger(EventsRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findPublicEvents(filters: EventsFilter): Promise<EventEntity[]> {
    const where: Prisma.EventWhereInput = this.buildFilter(filters, true);
    const orderBy: Prisma.EventOrderByWithRelationInput = filters.sortBy
      ? ({
          [filters.sortBy]: filters.sortOrder === 'desc' ? 'desc' : 'asc',
        } as Prisma.EventOrderByWithRelationInput)
      : { startDateTime: 'asc' };
    const events = await this.prisma.event.findMany({
      where,
      include: {
        ticketConfigs: true,
        resources: true,
      },
      orderBy,
      take: filters.limit,
    });
    const enriched = await this.addSaleWindows(events);
    return enriched.map(prismaEventToEventEntity);
  }

  async findEventsForHomepage(limit = 3): Promise<EventEntity[]> {
    const now = new Date();
    const includeRelations = { ticketConfigs: true, resources: true };
    
    const upcomingEventsRaw = await this.prisma.event.findMany({
      where: {
        OR: [{ startDateTime: { gte: now } }, { endDateTime: { gte: now } }],
        isArchived: false,
        deletedAt: null,
      },
      include: includeRelations,
      orderBy: { startDateTime: 'asc' },
      take: limit,
    });
    const upcomingEvents = await this.addSaleWindows(upcomingEventsRaw);

    if (upcomingEvents.length >= limit) {
      return upcomingEvents.map(prismaEventToEventEntity);
    }

    const remaining = limit - upcomingEvents.length;
    const pastEventsRaw = await this.prisma.event.findMany({
      where: {
        OR: [
          { endDateTime: { lt: now } },
          {
            AND: [{ endDateTime: null }, { startDateTime: { lt: now } }],
          },
        ],
        isArchived: false,
        deletedAt: null,
      },
      include: includeRelations,
      orderBy: [{ endDateTime: 'desc' }, { startDateTime: 'desc' }],
      take: remaining,
    });
    const pastEvents = await this.addSaleWindows(pastEventsRaw);

    return [...upcomingEvents, ...pastEvents].map(prismaEventToEventEntity);
  }

  async findEventById(id: string): Promise<EventEntity | null> {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { ticketConfigs: true, resources: true },
    });
    if (!event) return null;
    const [enriched] = await this.addSaleWindows([event]);
    return prismaEventToEventEntity(enriched);
  }

  async findEventByIdOrSlug(idOrSlug: string): Promise<EventEntity | null> {
    const event = await this.prisma.event.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: { ticketConfigs: true, resources: true },
    });
    if (!event) return null;
    const [enriched] = await this.addSaleWindows([event]);
    return prismaEventToEventEntity(enriched);
  }

  async findAdminEvents(filters: AdminEventsFilter): Promise<EventEntity[]> {
    const where: Prisma.EventWhereInput = this.buildFilter(filters, false);
    const orderBy: Prisma.EventOrderByWithRelationInput = filters.sortBy
      ? ({
          [filters.sortBy]: filters.sortOrder ?? 'asc',
        } as Prisma.EventOrderByWithRelationInput)
      : { startDateTime: 'desc' };

    const events = await this.prisma.event.findMany({
      where,
      include: { ticketConfigs: true, resources: true },
      orderBy,
      skip:
        filters.page && filters.limit
          ? (filters.page - 1) * filters.limit
          : undefined,
      take: filters.limit,
    });
    const enriched = await this.addSaleWindows(events);
    return enriched.map(prismaEventToEventEntity);
  }

  async createEvent(data: EventFormDataDto): Promise<EventEntity> {
    const input = eventFormDataDtoToPrismaInput(data);
    const event = await this.prisma.event.create({
      data: {
        ...input,
        ticketConfigs: undefined,
        resources: undefined,
      },
      include: { ticketConfigs: true, resources: true },
    });
    const [enriched] = await this.addSaleWindows([event]);
    return prismaEventToEventEntity(enriched);
  }

  async updateEvent(
    id: string,
    data: UpdateEventFormDataDto,
  ): Promise<EventEntity> {
    const input = eventUpdateFormDataDtoToPrismaInput(data);
    const event = await this.prisma.event.update({
      where: { id },
      data: {
        ...input,
        ticketConfigs: undefined,
        resources: undefined,
      },
      include: { ticketConfigs: true, resources: true },
    });
    const [enriched] = await this.addSaleWindows([event]);
    return prismaEventToEventEntity(enriched);
  }

  async resolveUniqueSlug(
    baseSlug: string,
    excludeId?: string,
  ): Promise<string> {
    let candidate = baseSlug;
    let suffix = 1;

    while (true) {
      const existing = await this.prisma.event.findFirst({
        where: {
          slug: candidate,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
      });

      if (!existing) {
        return candidate;
      }

      suffix += 1;
      candidate = `${baseSlug}-${suffix}`;
    }
  }

  async updateEventTickets(
    eventId: string,
    tickets: EventTicketConfigDto[],
  ): Promise<EventEntity | null> {
    const existing = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketConfigs: true },
    });
    if (!existing) return null;

    const normalizedTickets = tickets.map((t) => {
      const saleStartDate = t.saleStartDate ? new Date(t.saleStartDate) : null;
      const saleEndDate = t.saleEndDate ? new Date(t.saleEndDate) : null;

      return {
        eventId,
        type: t.type,
        price: new Prisma.Decimal(t.price),
        currency: t.currency,
        quantityTotal: t.quantityTotal,
        quantitySold: t.quantitySold || 0,
        earlyBirdEndDate: t.earlyBirdEndDate ? new Date(t.earlyBirdEndDate) : null,
        saleStartDate,
        saleEndDate,
      };
    });

    const newCapacityTotal = normalizedTickets.reduce((sum, t) => sum + (t.quantityTotal || 0), 0);
    const newCapacityRemaining = normalizedTickets.reduce((sum, t) => sum + Math.max((t.quantityTotal || 0) - (t.quantitySold || 0), 0), 0);

    await this.prisma.$transaction(async (tx) => {
      await tx.eventTicketConfig.deleteMany({ where: { eventId } });
      await tx.eventTicketConfig.createMany({ data: normalizedTickets as any });

      await tx.event.update({
        where: { id: eventId },
        data: {
          capacityTotal: newCapacityTotal,
          capacityRemaining: newCapacityRemaining,
        },
      });
    });

    return this.findEventById(eventId);
  }

  async updateEventResources(
    eventId: string,
    resources: EventResourceDto[],
  ): Promise<EventEntity | null> {
    const existing = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!existing) return null;

    await this.prisma.$transaction([
      this.prisma.eventResource.deleteMany({ where: { eventId } }),
      this.prisma.eventResource.createMany({
        data: resources.map((r) => ({
          eventId,
          titleFa: r.title.fa,
          titleEn: r.title.en || '',
          accessLevel: r.accessLevel,
          url: r.url,
          description: r.description || null,
        })),
      }),
    ]);

    return this.findEventById(eventId);
  }

  async setArchiveStatus(
    eventId: string,
    archived: boolean,
    byUserId?: string,
  ): Promise<EventEntity | null> {
    const event = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        isArchived: archived,
        archivedAt: archived ? new Date() : null,
        archivedById: archived ? (byUserId || null) : null,
      },
      include: { ticketConfigs: true, resources: true },
    });

    return prismaEventToEventEntity(event);
  }

  async softDeleteEvent(
    eventId: string,
    byUserId?: string,
  ): Promise<EventEntity | null> {
    const event = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        deletedAt: new Date(),
        deletedById: byUserId || null,
      },
      include: { ticketConfigs: true, resources: true },
    });
    return prismaEventToEventEntity(event);
  }

  async hardDeleteEvent(
    eventId: string,
    byUserId?: string,
  ): Promise<EventEntity | null> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketConfigs: true, resources: true },
    });
    if (!event) return null;

    await this.prisma.event.delete({ where: { id: eventId } });
    return prismaEventToEventEntity(event);
  }

  private buildFilter(
    filters: EventsFilter,
    publicOnly: boolean,
  ): Prisma.EventWhereInput {
    const where: Prisma.EventWhereInput = {};
    const andConditions: Prisma.EventWhereInput[] = [];
    const now = new Date();

    if (filters.status === 'upcoming') {
      andConditions.push({ startDateTime: { gte: now } });
    } else if (filters.status === 'past') {
      andConditions.push({
        OR: [
          { endDateTime: { lt: now } },
          { AND: [{ endDateTime: null }, { startDateTime: { lt: now } }] },
        ],
      });
    }

    if (filters.dateFrom || filters.dateTo) {
      andConditions.push({
        startDateTime: {
          ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
          ...(filters.dateTo ? { lte: filters.dateTo } : {}),
        },
      });
    }

    if (filters.type) {
      where.type = filters.type;
    }
    
    if (filters.city) {
      const normalizedCity = filters.city.trim();
      if (normalizedCity.length > 0) {
        andConditions.push({
          OR: [
            { city: { contains: normalizedCity } },
            { city: { contains: `"fa":"${normalizedCity}"` } },
            { city: { contains: `"en":"${normalizedCity}"` } },
          ],
        });
      }
    }

    if (filters.categories && filters.categories.length > 0) {
      andConditions.push({
        OR: filters.categories.map((category) => ({
          categories: { contains: category },
        })),
      });
    }

    if (publicOnly) {
      andConditions.push({ isArchived: false });
      andConditions.push({ deletedAt: null });
    } else {
      if (filters.archived === 'true') {
        andConditions.push({ isArchived: true });
      } else if (filters.archived === 'false') {
        andConditions.push({ isArchived: false });
      }

      if (filters.deleted === 'true') {
        andConditions.push({ deletedAt: { not: null } });
      } else if (filters.deleted === 'false') {
        andConditions.push({ deletedAt: null });
      }
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    return where;
  }

  private async addSaleWindows<
    T extends PrismaEvent & {
      ticketConfigs: PrismaEventTicketConfig[];
    },
  >(events: T[]): Promise<T[]> {
    if (!events || events.length === 0) return events;

    const ticketIds = events.flatMap(
      (event) => event.ticketConfigs?.map((ticket) => ticket.id) ?? [],
    );
    if (ticketIds.length === 0) return events;

    try {
      const saleWindows = await getTicketSaleWindows(this.prisma, ticketIds);
      return events.map((event) => ({
        ...event,
        ticketConfigs: (event.ticketConfigs ?? []).map((ticket) => ({
          ...ticket,
          saleStartDate: saleWindows.get(ticket.id)?.saleStartDate || null,
          saleEndDate: saleWindows.get(ticket.id)?.saleEndDate || null,
        })),
      })) as T[];
    } catch {
      return events;
    }
  }
}
