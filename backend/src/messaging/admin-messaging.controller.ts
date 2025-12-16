import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
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
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { MessagingService } from './messaging.service';
import { SendBulkMessageDto } from './dto/send-bulk-message.dto';
import { AuditService } from '../infrastructure/audit/audit.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Messaging')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN, AdminRole.EVENT_MANAGER, AdminRole.FINANCE)
@Controller({ path: 'admin/messaging', version: '1' })
export class AdminMessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly auditService: AuditService,
  ) {}

  @Post('send')
  @ApiOperation({
    summary: 'Send Bulk Message (Admin)',
    description:
      'Sends a bulk message via specified channels to a list of registered users.',
  })
  @ApiBody({ type: SendBulkMessageDto, required: true })
  @ApiOkResponse({
    description: 'Message queued for delivery.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid data.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async sendBulk(
    @Body() dto: SendBulkMessageDto,
    @CurrentUser() user: { sub: string },
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.messagingService.sendBulkMessage(dto);
    this.auditService.record({
      adminId: user.sub,
      action: 'SEND_BULK_MESSAGE',
      resourceType: 'messaging',
      resourceId: 'bulk',
      metadata: dto as any,
    });
    return result;
  }
}
