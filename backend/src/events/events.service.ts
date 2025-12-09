import { Injectable } from '@nestjs/common';
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

@Injectable()
export class EventsService {
  private readonly cacheTtl: number;

  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.cacheTtl = Number(this.configService.get('EVENTS_CACHE_TTL_SECONDS') ?? 120);
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
    const event = await this.eventsRepository.createEvent(data);
    await this.invalidateEventCaches(event.id);
    return eventEntityToEventDto(event);
  }

  async findEventById(id: string) {
    const event = await this.eventsRepository.findEventById(id);
    if (!event) return null;
    return eventEntityToEventDto(event);
  }

  async updateEvent(id: string, data: UpdateEventFormDataDto) {
    this.validateEventForm(data);
    const existing = await this.eventsRepository.findEventById(id);
    if (!existing) {
      return null;
    }
    const event = await this.eventsRepository.updateEvent(id, data);
    await this.invalidateEventCaches(id);
    return eventEntityToEventDto(event);
  }

  async updateEventTickets(
    eventId: string,
    tickets: EventTicketConfigDto[],
  ) {
    const updated = await this.eventsRepository.updateEventTickets(eventId, tickets);
    if (updated) await this.invalidateEventCaches(eventId);
    return updated ? eventEntityToEventDto(updated) : null;
  }

  async updateEventResources(
    eventId: string,
    resources: EventResourceDto[],
  ) {
    const updated = await this.eventsRepository.updateEventResources(eventId, resources);
    if (updated) await this.invalidateEventCaches(eventId);
    return updated ? eventEntityToEventDto(updated) : null;
  }

  async archiveEvent(eventId: string, archived: boolean, adminId?: string) {
    const updated = await this.eventsRepository.setArchiveStatus(eventId, archived, adminId);
    if (updated) {
      await this.invalidateEventCaches(eventId);
      return eventEntityToEventDto(updated);
    }
    return null;
  }

  async softDeleteEvent(eventId: string, adminId?: string) {
    const updated = await this.eventsRepository.softDeleteEvent(eventId, adminId);
    if (updated) {
      await this.invalidateEventCaches(eventId);
      return eventEntityToEventDto(updated);
    }
    return null;
  }

  async hardDeleteEvent(eventId: string, adminId?: string) {
    const deleted = await this.eventsRepository.hardDeleteEvent(eventId, adminId);
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
