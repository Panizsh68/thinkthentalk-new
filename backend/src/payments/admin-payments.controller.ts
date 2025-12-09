import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminRole, PaymentStatus } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { PaymentsService } from './payments.service';
import { PaymentDto } from './dto/payment.dto';
import { AdminPaymentsQueryDto } from './dto/admin-payments-query.dto';
import type { Response } from 'express';

@ApiTags('Admin')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN, AdminRole.FINANCE)
@Controller({ path: 'admin/payments', version: '1' })
export class AdminPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Get()
  @ApiOperation({
    summary: 'List All Payments (Admin)',
    description: 'Retrieves a list of all payment records for financial overview.',
  })
  @ApiOkResponse({ description: 'A list of payments.', type: PaymentDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  @ApiQuery({ name: 'eventId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  async listPayments(@Query() query: AdminPaymentsQueryDto): Promise<PaymentDto[]> {
    const { eventId, status } = query;
    return this.paymentsService.listAdminPayments({ eventId, status });
  }

  @Get('export')
  @ApiOperation({
    summary: 'Payments export (Admin)',
    description: 'Generates a CSV file of payments.',
  })
  @ApiOkResponse({
    description: 'A CSV file of payments.',
    content: { 'text/csv': { schema: { type: 'string' } } },
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  @ApiQuery({ name: 'eventId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  async exportPayments(@Query() query: AdminPaymentsQueryDto, @Res() res: Response) {
    const { eventId, status } = query;
    const payments = await this.paymentsService.listAdminPayments({ eventId, status });

    const header = [
      'id',
      'eventId',
      'registrationId',
      'amount',
      'currency',
      'status',
      'gatewayTransactionId',
      'createdAt',
    ];

    const rows = payments.map((p) => [
      p.id,
      p.eventId,
      p.registrationId,
      p.amount,
      p.currency,
      p.status,
      p.gatewayTransactionId ?? '',
      p.createdAt,
    ]);

    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="payments.csv"');
    return res.send(csv);
  }
}
