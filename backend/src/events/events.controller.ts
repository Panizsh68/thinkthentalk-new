import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EventType } from '@prisma/client';
import { EventsService } from './events.service';
import { EventDto } from './dto/event.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('Events')
@Controller({ path: 'events', version: '1' })
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({
    summary: 'List Events',
    description: 'Returns a list of events, with optional filters.',
  })
  @ApiQuery({
    name: 'showPastEvents',
    required: false,
    type: Boolean,
    description: 'Whether to include events that have already passed.',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: EventType,
    description: 'Filter by event type.',
  })
  @ApiQuery({
    name: 'city',
    required: false,
    type: String,
    description: 'Filter by city for offline events.',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by a specific category.',
  })
  @ApiQuery({
    name: 'categories[]',
    required: false,
    isArray: true,
    type: String,
    description:
      'Filter by multiple categories. Example: ?categories[]=design&categories[]=tech',
  })
  @ApiQuery({
    name: 'dateRange[from]',
    required: false,
    type: String,
    description: 'Filter events starting from this date/time (inclusive).',
  })
  @ApiQuery({
    name: 'dateRange[to]',
    required: false,
    type: String,
    description: 'Filter events up to this date/time (inclusive).',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['upcoming', 'past', 'all'],
    description: 'Filter by event status (upcoming/past/all)',
  })
  @ApiQuery({
    name: 'forHomepage',
    required: false,
    type: Boolean,
    description:
      'If true, returns exactly three events prioritizing upcoming ones for the homepage.',
  })
  @ApiOkResponse({
    description: 'A list of events.',
    type: EventDto,
    isArray: true,
  })
  async listEvents(
    @Query('showPastEvents') showPastEvents?: string,
    @Query('type') type?: string,
    @Query('city') city?: string,
    @Query('category') category?: string,
    @Query('categories[]') categories?: string[] | string,
    @Query('dateRange[from]') dateFrom?: string,
    @Query('dateRange[to]') dateTo?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: 'startDateTime' | 'createdAt',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('status') status?: 'upcoming' | 'past' | 'all',
    @Query('forHomepage') forHomepage?: string,
  ): Promise<EventDto[]> {
    if (forHomepage === 'true') {
      return this.eventsService.findEventsForHomepage(3);
    }

    const normalizedShowPastEvents =
      showPastEvents === 'true'
        ? true
        : showPastEvents === 'false'
          ? false
          : undefined;

    const normalizedCategories = (
      Array.isArray(categories) ? categories : categories ? [categories] : []
    )
      .flatMap((categoryValue) => categoryValue.split(','))
      .map((categoryValue) => categoryValue.trim())
      .filter(
        (categoryValue) =>
          categoryValue.length > 0 && categoryValue.toLowerCase() !== 'all',
      );

    const normalizedCity = (city ?? '').trim();
    const cleanCity =
      normalizedCity && normalizedCity.toLowerCase() !== 'all'
        ? normalizedCity
        : undefined;

    const normalizedCategory = (category ?? '').trim();
    const cleanCategory =
      normalizedCategory && normalizedCategory.toLowerCase() !== 'all'
        ? normalizedCategory
        : undefined;

    const normalizedType =
      typeof type === 'string'
        ? ((): EventType | undefined => {
            const upperType = type.toUpperCase() as EventType;
            return Object.values(EventType).includes(upperType)
              ? upperType
              : undefined;
          })()
        : undefined;

    const allowedStatuses: Array<'upcoming' | 'past' | 'all'> = [
      'upcoming',
      'past',
      'all',
    ];
    const normalizedStatus: 'upcoming' | 'past' | 'all' | undefined =
      status && allowedStatuses.includes(status)
        ? status
        : normalizedShowPastEvents
          ? 'all'
          : undefined;

    const parsedLimit = limit ? Number(limit) : undefined;
    const safeLimit =
      parsedLimit && !Number.isNaN(parsedLimit) && parsedLimit > 0
        ? parsedLimit
        : undefined;

    const safeSortBy =
      sortBy && ['startDateTime', 'createdAt'].includes(sortBy)
        ? sortBy
        : undefined;
    const safeSortOrder =
      sortOrder && ['asc', 'desc'].includes(sortOrder) ? sortOrder : undefined;

    const filters = {
      showPastEvents: normalizedShowPastEvents,
      type: normalizedType,
      city: cleanCity,
      category: cleanCategory,
      categories: normalizedCategories,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      limit: safeLimit,
      sortBy: safeSortBy,
      sortOrder: safeSortOrder,
      status: normalizedStatus,
    };

    return this.eventsService.findPublicEvents(filters);
  }

  @Get(':eventId')
  @ApiOperation({
    summary: 'Get Event Details',
    description: 'Retrieves the details of a single event by ID.',
  })
  @ApiParam({
    name: 'eventId',
    type: String,
    required: true,
    description: 'The ID of the event.',
  })
  @ApiOkResponse({ description: 'Event details.', type: EventDto })
  @ApiNotFoundResponse({
    description: 'Event not found.',
    type: ErrorResponseDto,
  })
  async getEventById(@Param('eventId') eventId: string): Promise<EventDto> {
    const event = await this.eventsService.findEventById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found.');
    }
    if (event.isArchived || event.deletedAt) {
      throw new NotFoundException('Event not found.');
    }
    return event;
  }
}
