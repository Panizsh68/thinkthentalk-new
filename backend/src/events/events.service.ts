import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { EventResourceDto } from './dto/event-resource.dto';
import { EventTicketConfigDto } from './dto/event-ticket-config.dto';
import { EventFormDataDto } from './dto/event-form-data.dto';
import { UpdateEventFormDataDto } from './dto/event-update-form-data.dto';
import {
  AdminEventsFilter,
  EventsFilter,
  EventsRepository,
} from './events.repository';
import { eventEntityToEventDto } from './mappers/event.mapper';
import { RedisService } from '../infrastructure/cache/redis.service';
import { buildEventSlug, slugify } from './utils/slug.helper';

@Injectable()
export class EventsService {
  private readonly cacheTtl: number;

  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.cacheTtl = Number(
      this.configService.get('EVENTS_CACHE_TTL_SECONDS') ?? 120,
    );
  }

  async findPublicEvents(filters: EventsFilter) {
    const events = await this.eventsRepository.findPublicEvents(filters);
    return events.map(eventEntityToEventDto);
  }

  async findEventsForHomepage(limit = 3) {
    const events = await this.eventsRepository.findEventsForHomepage(limit);
    return events.map(eventEntityToEventDto);
  }

  async findAdminEvents(filters: AdminEventsFilter) {
    const events = await this.eventsRepository.findAdminEvents(filters);
    return events.map(eventEntityToEventDto);
  }

  async createEvent(data: EventFormDataDto) {
    this.validateEventForm(data);
    const baseSlug = data.slug?.trim()
      ? slugify(data.slug)
      : buildEventSlug(data.title);
    const slug = await this.eventsRepository.resolveUniqueSlug(baseSlug);
    const event = await this.eventsRepository.createEvent({
      ...data,
      slug,
    });
    await this.invalidateEventCaches(event.id);
    return eventEntityToEventDto(event);
  }

  async findEventById(id: string) {
    const event = await this.eventsRepository.findEventById(id);
    if (!event) return null;
    return eventEntityToEventDto(event);
  }

  async findEventByIdOrSlug(idOrSlug: string) {
    const event = await this.eventsRepository.findEventByIdOrSlug(idOrSlug);
    if (!event) return null;
    return eventEntityToEventDto(event);
  }

  async updateEvent(id: string, data: UpdateEventFormDataDto) {
    this.validateEventForm(data);
    const existing = await this.eventsRepository.findEventById(id);
    if (!existing) {
      return null;
    }
    const baseSlug = data.slug?.trim()
      ? slugify(data.slug)
      : data.title
        ? buildEventSlug(data.title)
        : existing.slug;
    const nextSlug =
      baseSlug === existing.slug
        ? existing.slug
        : await this.eventsRepository.resolveUniqueSlug(baseSlug, id);
    const event = await this.eventsRepository.updateEvent(id, {
      ...data,
      slug: nextSlug,
    });
    await this.invalidateEventCaches(id);
    return eventEntityToEventDto(event);
  }

  async updateEventTickets(eventId: string, tickets: EventTicketConfigDto[]) {
    const now = new Date();
    tickets.forEach((t) => {
      // sale window optional with current Prisma client; if provided, validate order.
      if (t.saleStartDate && t.saleEndDate) {
        const start = new Date(t.saleStartDate);
        const end = new Date(t.saleEndDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new BadRequestException('Invalid sale window for ticket.');
        }
        if (start > end) {
          throw new BadRequestException(
            'saleStartDate must be before saleEndDate.',
          );
        }
        if (end.getTime() < now.getTime() && t.quantityTotal > 0) {
          // allow but note expired window; capacity will still update.
        }
      }
      if (t.quantitySold !== undefined && t.quantitySold > t.quantityTotal) {
        throw new BadRequestException(
          'quantitySold cannot exceed quantityTotal.',
        );
      }
    });

    const updated = await this.eventsRepository.updateEventTickets(
      eventId,
      tickets,
    );
    if (updated) await this.invalidateEventCaches(eventId);
    return updated ? eventEntityToEventDto(updated) : null;
  }

  async updateEventResources(eventId: string, resources: EventResourceDto[]) {
    const updated = await this.eventsRepository.updateEventResources(
      eventId,
      resources,
    );
    if (updated) await this.invalidateEventCaches(eventId);
    return updated ? eventEntityToEventDto(updated) : null;
  }

  async archiveEvent(eventId: string, archived: boolean, adminId?: string) {
    const updated = await this.eventsRepository.setArchiveStatus(
      eventId,
      archived,
      adminId,
    );
    if (updated) {
      await this.invalidateEventCaches(eventId);
      return eventEntityToEventDto(updated);
    }
    return null;
  }

  async softDeleteEvent(eventId: string, adminId?: string) {
    const updated = await this.eventsRepository.softDeleteEvent(
      eventId,
      adminId,
    );
    if (updated) {
      await this.invalidateEventCaches(eventId);
      return eventEntityToEventDto(updated);
    }
    return null;
  }

  async hardDeleteEvent(eventId: string, adminId?: string) {
    const deleted = await this.eventsRepository.hardDeleteEvent(
      eventId,
      adminId,
    );
    if (deleted) {
      await this.invalidateEventCaches(eventId);
      return eventEntityToEventDto(deleted);
    }
    return null;
  }

  private validateEventForm(data: EventFormDataDto | UpdateEventFormDataDto) {
    if (data.capacityTotal !== undefined && data.capacityTotal < 0) {
      throw new Error('capacityTotal must be non-negative');
    }
  }

  private buildListCacheKey(filters: EventsFilter): string {
    const serialized = JSON.stringify(filters ?? {});
    const hash = createHash('sha1').update(serialized).digest('hex');
    return `events:list:${hash}`;
  }

  private async invalidateEventCaches(eventId: string) {
    await Promise.all([
      this.redisService.del(`events:detail:${eventId}`),
      this.redisService.delByPrefix('events:list:'),
    ]);
  }
}
