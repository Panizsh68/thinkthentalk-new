import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  Patch,
  Post,
  Query,
  UseGuards,
  Param,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiCreatedResponse,
  ApiBody,
  ApiParam,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { EventDto } from '../dto/event.dto';
import { EventsService } from '../events.service';
import { EventFormDataDto } from '../dto/event-form-data.dto';
import { UpdateEventFormDataDto } from '../dto/event-update-form-data.dto';
import { EventTicketConfigDto } from '../dto/event-ticket-config.dto';
import { EventResourceDto } from '../dto/event-resource.dto';
import { AdminEventsQueryDto } from '../dto/admin-events-query.dto';
import { ArchiveEventDto } from '../dto/archive-event.dto';
import { AuditService } from '../../infrastructure/audit/audit.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RedisService } from '../../infrastructure/cache/redis.service';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@ApiTags('Admin')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN, AdminRole.EVENT_MANAGER, AdminRole.FINANCE)
@Controller({ path: 'admin/events', version: '1' })
export class AdminEventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly auditService: AuditService,
    private readonly redisService: RedisService,
  ) { }

  @Get()
  @ApiOperation({
    summary: 'List All Events (Admin)',
    description: 'Retrieves a list of all events for the admin panel, including past events.',
  })
  @ApiOkResponse({
    description: 'A list of all events.',
    type: EventDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async listAdminEvents(@Query() rawQuery: Record<string, any>): Promise<EventDto[]> {
    const query = plainToInstance(AdminEventsQueryDto, rawQuery, {
      enableImplicitConversion: true,
      exposeUnsetFields: false,
    });
    const errors = await validate(query, { whitelist: true, forbidNonWhitelisted: false });
    if (errors.length) {
      const message = errors
        .flatMap((error) => Object.values(error.constraints ?? {}))
        .filter(Boolean)
        .join('; ') || 'Validation failed';
      throw new BadRequestException(message);
    }

    const {
      page = 1,
      limit = 20,
      sortBy,
      sortOrder,
      status,
      type,
      archived = 'false',
      deleted = 'false',
    } = query;
    return this.eventsService.findAdminEvents({ page, limit, sortBy, sortOrder, status, type, archived, deleted });
  }

  @Post()
  @ApiOperation({
    summary: 'Create Event (Admin)',
    description: 'Creates a new event.',
  })
  @ApiCreatedResponse({ description: 'Event created successfully.', type: EventDto })
  @ApiBadRequestResponse({ description: 'Invalid data.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  @ApiBody({ type: EventFormDataDto, required: true })
  async createEvent(@Body() dto: EventFormDataDto, @CurrentUser() user: { sub: string }): Promise<EventDto> {
    const event = await this.eventsService.createEvent(dto);
    this.auditService.record({
      adminId: user.sub,
      action: 'CREATE_EVENT',
      resourceType: 'event',
      resourceId: event.id,
      metadata: dto as any,
    });
    await this.redisService.delByPrefix('events:list:');
    return event;
  }

  @Get(':eventId')
  @ApiOperation({
    summary: 'Get Event (Admin)',
    description: 'Retrieves a single event for editing in the admin panel.',
  })
  @ApiParam({ name: 'eventId', type: String, required: true, description: 'The ID of the event.' })
  @ApiOkResponse({ description: 'Event data.', type: EventDto })
  @ApiNotFoundResponse({ description: 'Event not found.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async getAdminEvent(@Param('eventId') eventId: string): Promise<EventDto> {
    const event = await this.eventsService.findEventById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found.');
    }
    return event;
  }

  @Patch(':eventId')
  @ApiOperation({
    summary: 'Update Event (Admin)',
    description: 'Updates the core details of an event.',
  })
  @ApiParam({ name: 'eventId', type: String, required: true, description: 'The ID of the event.' })
  @ApiOkResponse({ description: 'Event updated.', type: EventDto })
  @ApiBadRequestResponse({ description: 'Invalid data.', type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Event not found.', type: ErrorResponseDto })
  @ApiBody({ type: UpdateEventFormDataDto, required: true })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async updateAdminEvent(
    @Param('eventId') eventId: string,
    @Body() dto: UpdateEventFormDataDto,
    @CurrentUser() user: { sub: string },
  ): Promise<EventDto> {
    const event = await this.eventsService.updateEvent(eventId, dto);
    if (!event) {
      throw new NotFoundException('Event not found.');
    }
    this.auditService.record({
      adminId: user.sub,
      action: 'UPDATE_EVENT',
      resourceType: 'event',
      resourceId: eventId,
      metadata: dto as any,
    });
    await this.redisService.delByPrefix('events:list:');
    await this.redisService.del(`events:detail:${eventId}`);
    return event;
  }

  @Patch(':eventId/tickets')
  @ApiOperation({
    summary: 'Update Event Tickets (Admin)',
    description:
      'Updates the ticket configuration for a specific event. The provided list replaces the existing configuration.',
  })
  @ApiParam({ name: 'eventId', type: String, required: true, description: 'The ID of the event.' })
  @ApiOkResponse({ description: 'Ticket configuration updated.', type: EventDto })
  @ApiBadRequestResponse({ description: 'Invalid data.', type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Event not found.', type: ErrorResponseDto })
  @ApiBody({ type: EventTicketConfigDto, isArray: true, required: true })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async updateEventTickets(
    @Param('eventId') eventId: string,
    @Body() tickets: EventTicketConfigDto[],
    @CurrentUser() user: { sub: string },
  ): Promise<EventDto> {
    const event = await this.eventsService.updateEventTickets(eventId, tickets);
    if (!event) {
      throw new NotFoundException('Event not found.');
    }
    this.auditService.record({
      adminId: user.sub,
      action: 'UPDATE_EVENT_TICKETS',
      resourceType: 'event',
      resourceId: eventId,
      metadata: { tickets } as any,
    });
    await this.redisService.delByPrefix('events:list:');
    await this.redisService.del(`events:detail:${eventId}`);
    return event;
  }

  @Patch(':eventId/resources')
  @ApiOperation({
    summary: 'Update Event Resources (Admin)',
    description:
      'Updates the list of downloadable or linkable resources for an event. The provided list replaces existing resources.',
  })
  @ApiParam({ name: 'eventId', type: String, required: true, description: 'The ID of the event.' })
  @ApiOkResponse({ description: 'Resources updated.', type: EventDto })
  @ApiBadRequestResponse({ description: 'Invalid data.', type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Event not found.', type: ErrorResponseDto })
  @ApiBody({ type: EventResourceDto, isArray: true, required: true })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async updateEventResources(
    @Param('eventId') eventId: string,
    @Body() resources: EventResourceDto[],
    @CurrentUser() user: { sub: string },
  ): Promise<EventDto> {
    const event = await this.eventsService.updateEventResources(eventId, resources);
    if (!event) {
      throw new NotFoundException('Event not found.');
    }
    this.auditService.record({
      adminId: user.sub,
      action: 'UPDATE_EVENT_RESOURCES',
      resourceType: 'event',
      resourceId: eventId,
      metadata: { resources } as any,
    });
    await this.redisService.delByPrefix('events:list:');
    await this.redisService.del(`events:detail:${eventId}`);
    return event;
  }

  @Patch(':eventId/archive')
  @ApiOperation({
    summary: 'Archive or unarchive an event',
    description: 'Toggles the archive status of an event without deleting it.',
  })
  @ApiParam({ name: 'eventId', type: String, required: true, description: 'The ID of the event.' })
  @ApiBody({ type: ArchiveEventDto })
  @ApiOkResponse({ description: 'Updated event.', type: EventDto })
  async archiveEvent(
    @Param('eventId') eventId: string,
    @Body() dto: ArchiveEventDto,
    @CurrentUser() user: { sub: string },
  ): Promise<EventDto> {
    const event = await this.eventsService.archiveEvent(eventId, dto.archived, user.sub);
    if (!event) {
      throw new NotFoundException('Event not found.');
    }
    this.auditService.record({
      adminId: user.sub,
      action: dto.archived ? 'ARCHIVE_EVENT' : 'UNARCHIVE_EVENT',
      resourceType: 'event',
      resourceId: eventId,
      metadata: { archived: dto.archived } as any,
    });
    await this.redisService.delByPrefix('events:list:');
    await this.redisService.del(`events:detail:${eventId}`);
    return event;
  }

  @Delete(':eventId')
  @ApiOperation({
    summary: 'Delete Event (Admin)',
    description:
      'Performs a soft delete by default. Provide force=true query param and confirmation header for permanent deletion.',
  })
  @ApiParam({ name: 'eventId', type: String, required: true, description: 'The ID of the event.' })
  @ApiOkResponse({ description: 'Deletion result.', type: EventDto })
  async deleteEvent(
    @Param('eventId') eventId: string,
    @Query('force') force: string | undefined,
    @Headers('x-confirm-delete') confirmHeader: string | undefined,
    @CurrentUser() user: { sub: string; role?: AdminRole },
  ): Promise<EventDto> {
    const forceDelete = force === 'true';

    if (forceDelete) {
      if (user.role !== AdminRole.ADMIN) {
        throw new ForbiddenException('Only admins may perform permanent deletions.');
      }
      if (!confirmHeader || confirmHeader.toLowerCase() !== 'true') {
        throw new BadRequestException('Hard delete requires X-Confirm-Delete: true header.');
      }
      const deleted = await this.eventsService.hardDeleteEvent(eventId, user.sub);
      if (!deleted) {
        throw new NotFoundException('Event not found.');
      }
      this.auditService.record({
        adminId: user.sub,
        action: 'HARD_DELETE_EVENT',
        resourceType: 'event',
        resourceId: eventId,
        metadata: { force: true } as any,
      });
      await this.redisService.delByPrefix('events:list:');
      await this.redisService.del(`events:detail:${eventId}`);
      return deleted;
    }

    const event = await this.eventsService.softDeleteEvent(eventId, user.sub);
    if (!event) {
      throw new NotFoundException('Event not found.');
    }
    this.auditService.record({
      adminId: user.sub,
      action: 'SOFT_DELETE_EVENT',
      resourceType: 'event',
      resourceId: eventId,
    });
    await this.redisService.delByPrefix('events:list:');
    await this.redisService.del(`events:detail:${eventId}`);
    return event;
  }
}
