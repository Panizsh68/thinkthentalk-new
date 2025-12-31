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
    const getFinishTime = (event: PrismaEvent) =>
      (event.endDateTime ?? event.startDateTime).getTime();

    const upcomingEventsRaw = await this.prisma.event.findMany({
      where: {
        OR: [{ startDateTime: { gte: now } }, { endDateTime: { gte: now } }],
        isArchived: false,
        deletedAt: null,
      },
      include: includeRelations,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    const upcomingEvents = await this.addSaleWindows(upcomingEventsRaw);
    const upcomingSorted = [...upcomingEvents].sort(
      (a, b) => a.startDateTime.getTime() - b.startDateTime.getTime(),
    );

    if (upcomingSorted.length >= limit) {
      return upcomingSorted.map(prismaEventToEventEntity);
    }

    const remaining = limit - upcomingSorted.length;
    const pastEventsRaw =
      remaining > 0
        ? await this.prisma.event.findMany({
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
          })
        : [];
    const pastEvents = await this.addSaleWindows(pastEventsRaw);
    const pastSorted = [...pastEvents].sort(
      (a, b) => getFinishTime(b) - getFinishTime(a),
    );

    return [...upcomingSorted, ...pastSorted].map(prismaEventToEventEntity);
  }

  async findEventById(id: string): Promise<EventEntity | null> {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { ticketConfigs: true, resources: true },
    });
    if (!event) {
      return null;
    }
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

  async updateEventTickets(
    eventId: string,
    tickets: EventTicketConfigDto[],
  ): Promise<EventEntity | null> {
    const existing = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketConfigs: true },
    });
    if (!existing) {
      return null;
    }

    const existingByType = new Map(
      (existing.ticketConfigs ?? []).map((t) => [t.type, t]),
    );

    const normalizedTickets = tickets.map((t) => {
      const prev = existingByType.get(t.type);
      const quantitySold = t.quantitySold ?? prev?.quantitySold ?? 0;
      const saleStartDate = t.saleStartDate
        ? new Date(t.saleStartDate)
        : existing.startDateTime;
      const saleEndDate = t.saleEndDate
        ? new Date(t.saleEndDate)
        : (existing.endDateTime ??
          new Date(saleStartDate.getTime() + 30 * 24 * 60 * 60 * 1000));

      return {
        eventId,
        type: t.type,
        price: t.price,
        currency: t.currency,
        quantityTotal: t.quantityTotal,
        quantitySold,
        earlyBirdEndDate: t.earlyBirdEndDate
          ? new Date(t.earlyBirdEndDate)
          : null,
        _saleStartDate: saleStartDate, // keep for capacity calc
        _saleEndDate: saleEndDate, // keep for capacity calc
      };
    });

    const newCapacityTotal = normalizedTickets.reduce(
      (sum, t) => sum + (t.quantityTotal ?? 0),
      0,
    );
    const remainingByTicket = normalizedTickets.map((t) =>
      Math.max((t.quantityTotal ?? 0) - (t.quantitySold ?? 0), 0),
    );
    const newCapacityRemaining = remainingByTicket.reduce(
      (sum, r) => sum + r,
      0,
    );

    const ticketsToPersist = normalizedTickets.map(
      ({ _saleStartDate, _saleEndDate, ...rest }) => rest,
    );

    // Detect actual column names once to avoid failing when DB is missing/mapping sale window fields.
    const saleWindowColumns = await this.prisma.$queryRaw<
      Array<{ column_name: string }>
    >`SELECT COLUMN_NAME as column_name FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'EventTicketConfig' AND COLUMN_NAME IN ('saleStartDate','sale_start_date','saleEndDate','sale_end_date')`;

    const columnNameByLower = new Map(
      saleWindowColumns.map((c) => [
        c.column_name.toLowerCase(),
        c.column_name,
      ]),
    );
    const saleStartColumn =
      columnNameByLower.get('salestartdate') ??
      columnNameByLower.get('sale_start_date');
    const saleEndColumn =
      columnNameByLower.get('saleenddate') ??
      columnNameByLower.get('sale_end_date');
    const canPersistSaleWindow = Boolean(saleStartColumn && saleEndColumn);

    await this.prisma.$transaction(async (tx) => {
      await tx.eventTicketConfig.deleteMany({ where: { eventId } });
      // Current Prisma client version does not include saleStartDate/saleEndDate; avoid passing unknown args.
      await tx.eventTicketConfig.createMany({ data: ticketsToPersist });

      // Manually persist sale window via raw SQL to keep DB in sync until Prisma client is regenerated.
      if (canPersistSaleWindow) {
        const updateSql = `UPDATE EventTicketConfig SET ${saleStartColumn} = ?, ${saleEndColumn} = ? WHERE eventId = ? AND type = ?`;
        for (const ticket of normalizedTickets) {
          if (ticket._saleStartDate || ticket._saleEndDate) {
            await tx.$executeRawUnsafe(
              updateSql,
              ticket._saleStartDate ?? null,
              ticket._saleEndDate ?? null,
              eventId,
              ticket.type,
            );
          }
        }
      } else {
        this.logger.warn(
          'Skipping ticket sale window update because saleStartDate/saleEndDate columns were not found in EventTicketConfig',
        );
      }

      await tx.event.update({
        where: { id: eventId },
        data: {
          capacityTotal: newCapacityTotal,
          capacityRemaining: newCapacityRemaining,
        },
      });
    });

    const event = await this.findEventById(eventId);
    return event;
  }

  async updateEventResources(
    eventId: string,
    resources: EventResourceDto[],
  ): Promise<EventEntity | null> {
    const existing = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
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
        archivedById: archived ? (byUserId ?? null) : null,
      },
      include: { ticketConfigs: true, resources: true },
    });

    await this.recordAudit(
      event.id,
      archived ? 'ARCHIVE' : 'UNARCHIVE',
      byUserId,
      {
        previousArchived: existing.isArchived,
        nextArchived: event.isArchived,
      },
    );

    return prismaEventToEventEntity(event);
  }

  async softDeleteEvent(
    eventId: string,
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

  async hardDeleteEvent(
    eventId: string,
    byUserId?: string,
  ): Promise<EventEntity | null> {
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
      andConditions.push({
        categories: { array_contains: [filters.category] },
      });
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

  private async addSaleWindows<
    T extends PrismaEvent & {
      ticketConfigs: PrismaEventTicketConfig[];
      resources: any;
    },
  >(events: T[]): Promise<T[]> {
    if (!events || events.length === 0) {
      return events;
    }

    const ticketIds = events.flatMap(
      (event) => event.ticketConfigs?.map((ticket) => ticket.id) ?? [],
    );
    if (ticketIds.length === 0) {
      return events;
    }

    const saleWindows = await getTicketSaleWindows(this.prisma, ticketIds);

    return events.map((event) => ({
      ...event,
      ticketConfigs: (event.ticketConfigs ?? []).map((ticket) => ({
        ...ticket,
        saleStartDate: saleWindows.get(ticket.id)?.saleStartDate ?? null,
        saleEndDate: saleWindows.get(ticket.id)?.saleEndDate ?? null,
      })),
    })) as T[];
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
