import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AdminRole, EventIdeaStatus, EventIdeaType } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { EventIdeasService } from './event-ideas.service';
import { CreateEventIdeaDto } from './dto/create-event-idea.dto';

@ApiTags('Event Ideas')
@Controller({ path: 'event-ideas', version: '1' })
export class EventIdeasController {
  constructor(private readonly eventIdeasService: EventIdeasService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new event idea' })
  async submitIdea(@Body() dto: CreateEventIdeaDto, @CurrentUser() user: any) {
    return this.eventIdeasService.create(dto, user?.sub);
  }

  @Get('admin')
  @ApiBearerAuth('bearerAuth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.EVENT_MANAGER)
  @ApiOperation({ summary: 'List all ideas (Admin)' })
  @ApiQuery({ name: 'status', required: false, enum: EventIdeaStatus })
  @ApiQuery({ name: 'type', required: false, enum: EventIdeaType })
  async listIdeas(
    @Query('status') status?: EventIdeaStatus,
    @Query('type') type?: EventIdeaType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.eventIdeasService.findAll({ status, type, page, limit });
  }

  @Patch('admin/:id/status')
  @ApiBearerAuth('bearerAuth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.EVENT_MANAGER)
  @ApiOperation({ summary: 'Update idea status (Admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: EventIdeaStatus,
  ) {
    return this.eventIdeasService.updateStatus(id, status);
  }

  @Delete('admin/:id')
  @ApiBearerAuth('bearerAuth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN)
  @ApiOperation({ summary: 'Delete idea (Admin)' })
  async deleteIdea(@Param('id') id: string) {
    return this.eventIdeasService.delete(id);
  }
}
