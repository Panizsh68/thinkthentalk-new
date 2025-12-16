import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ContactService } from './contact.service';
import { ListContactMessagesQueryDto } from './dto/list-contact-messages.dto';
import {
  PaginatedContactMessagesDto,
  ContactMessageDto,
} from './dto/contact-message.dto';
import { UpdateContactStatusDto } from './dto/update-contact-status.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('Contact (Admin)')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN, AdminRole.EVENT_MANAGER, AdminRole.FINANCE)
@Controller({ path: 'admin/contact', version: '1' })
export class AdminContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  @ApiOperation({ summary: 'List contact messages' })
  @ApiOkResponse({ type: PaginatedContactMessagesDto })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async list(
    @Query() query: ListContactMessagesQueryDto,
  ): Promise<PaginatedContactMessagesDto> {
    return this.contactService.listMessages(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contact message by id' })
  @ApiOkResponse({ type: ContactMessageDto })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async get(@Param('id') id: string): Promise<ContactMessageDto> {
    return this.contactService.getMessage(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update the status of a contact message' })
  @ApiOkResponse({ type: ContactMessageDto })
  @ApiBadRequestResponse({
    description: 'Invalid status.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateContactStatusDto,
  ): Promise<ContactMessageDto> {
    return this.contactService.updateStatus(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive a contact message' })
  @ApiOkResponse({ type: ContactMessageDto })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async archive(@Param('id') id: string): Promise<ContactMessageDto> {
    return this.contactService.archiveMessage(id);
  }
}
