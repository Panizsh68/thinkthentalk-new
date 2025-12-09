import { Injectable } from '@nestjs/common';
import { Event as PrismaEvent, Prisma, EventType } from '@prisma/client';
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
  constructor(private readonly prisma: PrismaService) { }

  async findPublicEvents(filters: EventsFilter): Promise<EventEntity[]> {
    const where: Prisma.EventWhereInput = this.buildFilter(filters, true);
    const orderBy: Prisma.EventOrderByWithRelationInput = filters.sortBy
      ? ({ [filters.sortBy]: filters.sortOrder === 'desc' ? 'desc' : 'asc' } as Prisma.EventOrderByWithRelationInput)
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
    return events.map(prismaEventToEventEntity);
  }

  async findEventsForHomepage(limit = 3): Promise<EventEntity[]> {
    const now = new Date();
    const includeRelations = { ticketConfigs: true, resources: true };

    const upcomingEvents = await this.prisma.event.findMany({
      where: { startDateTime: { gte: now }, isArchived: false, deletedAt: null },
      include: includeRelations,
      orderBy: { startDateTime: 'asc' },
      take: limit,
    });

    if (upcomingEvents.length >= limit) {
      return upcomingEvents.map(prismaEventToEventEntity);
    }

    const remaining = limit - upcomingEvents.length;
    const pastEvents =
      remaining > 0
        ? await this.prisma.event.findMany({
          where: {
            OR: [
              { endDateTime: { lt: now } },
              { AND: [{ endDateTime: null }, { startDateTime: { lt: now } }] },
            ],
            isArchived: false,
            deletedAt: null,
          },
          include: includeRelations,
          orderBy: { startDateTime: 'desc' },
          take: remaining,
        })
        : [];

    return [...upcomingEvents, ...pastEvents].map(prismaEventToEventEntity);
  }

  async findEventById(id: string): Promise<EventEntity | null> {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { ticketConfigs: true, resources: true },
    });
    return event ? prismaEventToEventEntity(event) : null;
  }

  async findAdminEvents(filters: AdminEventsFilter): Promise<EventEntity[]> {
    const where: Prisma.EventWhereInput = this.buildFilter(filters, false);
    const orderBy: Prisma.EventOrderByWithRelationInput = filters.sortBy
      ? ({ [filters.sortBy]: filters.sortOrder ?? 'asc' } as Prisma.EventOrderByWithRelationInput)
      : { startDateTime: 'desc' };
      
    const events = await this.prisma.event.findMany({
      where,
      include: { ticketConfigs: true, resources: true },
      orderBy,
      skip: filters.page && filters.limit ? (filters.page - 1) * filters.limit : undefined,
      take: filters.limit,
    });
    return events.map(prismaEventToEventEntity);
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
    return prismaEventToEventEntity(event);
  }

  async updateEvent(id: string, data: UpdateEventFormDataDto): Promise<EventEntity> {
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
    return prismaEventToEventEntity(event);
  }

  async updateEventTickets(
    eventId: string,
    tickets: EventTicketConfigDto[],
  ): Promise<EventEntity | null> {
    const existing = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) {
      return null;
    }

    await this.prisma.$transaction([
      this.prisma.eventTicketConfig.deleteMany({ where: { eventId } }),
      this.prisma.eventTicketConfig.createMany({
        data: tickets.map((t) => ({
          eventId,
          type: t.type,
          price: t.price,
          currency: t.currency,
          quantityTotal: t.quantityTotal,
          quantitySold: t.quantitySold,
          earlyBirdEndDate: t.earlyBirdEndDate
            ? new Date(t.earlyBirdEndDate)
            : null,
        })),
      }),
    ]);

    const event = await this.findEventById(eventId);
    return event;
  }

  async updateEventResources(
    eventId: string,
    resources: EventResourceDto[],
  ): Promise<EventEntity | null> {
    const existing = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) {
      return null;
    }

    await this.prisma.$transaction([
      this.prisma.eventResource.deleteMany({ where: { eventId } }),
      this.prisma.eventResource.createMany({
        data: resources.map((r) => ({
          eventId,
          titleFa: r.title.fa,
          titleEn: r.title.en ?? '',
          accessLevel: r.accessLevel,
          url: r.url,
          description: r.description ?? null,
        })),
      }),
    ]);

    const event = await this.findEventById(eventId);
    return event;
  }

  async setArchiveStatus(
    eventId: string,
    archived: boolean,
    byUserId?: string,
  ): Promise<EventEntity | null> {
    const existing = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketConfigs: true, resources: true },
    });
    if (!existing) {
      return null;
    }

    const event = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        isArchived: archived,
        archivedAt: archived ? new Date() : null,
        archivedById: archived ? byUserId ?? null : null,
      },
      include: { ticketConfigs: true, resources: true },
    });

    await this.recordAudit(event.id, archived ? 'ARCHIVE' : 'UNARCHIVE', byUserId, {
      previousArchived: existing.isArchived,
      nextArchived: event.isArchived,
    });

    return prismaEventToEventEntity(event);
  }

  async softDeleteEvent(eventId: string, byUserId?: string): Promise<EventEntity | null> {
    const existing = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketConfigs: true, resources: true },
    });
    if (!existing) {
      return null;
    }
    const event = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        deletedAt: new Date(),
        deletedById: byUserId ?? null,
      },
      include: { ticketConfigs: true, resources: true },
    });

    await this.recordAudit(event.id, 'SOFT_DELETE', byUserId, {
      deletedAt: event.deletedAt,
    });

    return prismaEventToEventEntity(event);
  }

  async hardDeleteEvent(eventId: string, byUserId?: string): Promise<EventEntity | null> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketConfigs: true, resources: true },
    });
    if (!event) {
      return null;
    }

    await this.recordAudit(event.id, 'HARD_DELETE', byUserId, {
      snapshot: {
        title: event.title,
        startDateTime: event.startDateTime,
        endDateTime: event.endDateTime,
      },
    });

    await this.prisma.event.delete({ where: { id: eventId } });
    return prismaEventToEventEntity(event);
  }

  private buildFilter(filters: EventsFilter, publicOnly: boolean): Prisma.EventWhereInput {
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
    } else if (filters.status !== 'all' && filters.showPastEvents === false) {
      // Legacy support for public-facing filter
      andConditions.push({ startDateTime: { gte: now } });
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
            { city: normalizedCity },
            { city: { contains: `"fa":"${normalizedCity}"` } },
            { city: { contains: `"en":"${normalizedCity}"` } },
          ],
        });
      }
    }
    if (filters.category) {
      andConditions.push({ categories: { array_contains: [filters.category] } });
    }
    if (filters.categories && filters.categories.length > 0) {
      andConditions.push({
        OR: filters.categories.map((category) => ({
          categories: { array_contains: [category] },
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

    if (andConditions.length === 1) {
      Object.assign(where, andConditions[0]);
    } else if (andConditions.length > 1) {
      where.AND = andConditions;
    }

    return where;
  }

  private async recordAudit(
    eventId: string,
    action: string,
    byUserId?: string,
    meta?: Prisma.InputJsonValue,
  ): Promise<void> {
    await this.prisma.eventAudit.create({
      data: {
        eventId,
        eventIdSnapshot: eventId,
        action,
        byUserId: byUserId ?? null,
        meta,
      },
    });
  }
}
