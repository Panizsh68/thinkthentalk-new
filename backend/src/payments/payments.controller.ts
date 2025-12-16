import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  NotFoundException,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBody,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { CreatePaymentBodyDto } from './dto/create-payment-body.dto';
import { PaymentDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';
import { VerifyPaymentStatusDto } from './dto/verify-payment-status.dto';

@ApiTags('Payments')
@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('public/:paymentId')
  @ApiOperation({
    summary: 'Get Payment Details (Public)',
    description:
      'Public endpoint to retrieve a payment by ID. If status/authority are provided and the payment is pending, verification will be attempted.',
  })
  @ApiParam({ name: 'paymentId', type: String })
  @ApiOkResponse({ description: 'Payment details.', type: PaymentDto })
  @ApiNotFoundResponse({
    description: 'Payment record not found.',
    type: ErrorResponseDto,
  })
  async getPaymentPublic(
    @Param('paymentId') paymentId: string,
    @Query('Status') status?: string,
    @Query('status') statusLower?: string,
    @Query('Authority') authority?: string | null,
  ): Promise<PaymentDto> {
    const normalizedStatus = (statusLower ?? status ?? '').toUpperCase();
    const statusValue =
      normalizedStatus === 'OK' || normalizedStatus === 'SUCCESS'
        ? 'SUCCESS'
        : normalizedStatus === 'NOK' || normalizedStatus === 'FAILED'
          ? 'FAILED'
          : undefined;

    const payment = await this.paymentsService.getPaymentPublic(paymentId, {
      status: statusValue,
      authority,
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found.');
    }

    return payment;
  }

  @Get('callback')
  @ApiOperation({
    summary: 'Zarinpal callback (public)',
    description:
      'Handles payment gateway callback without requiring authentication.',
  })
  async handleGatewayCallback(
    @Query('paymentId') paymentId?: string,
    @Query('Authority') authority?: string,
    @Query('Status') status?: string,
    @Res() res?: Response,
  ): Promise<any> {
    if (!paymentId) {
      throw new NotFoundException('Payment record not found.');
    }

    const normalizedStatus = status === 'OK' ? 'SUCCESS' : 'FAILED';
    const payment = await this.paymentsService.verifyPaymentStatusPublic(
      paymentId,
      {
        status: normalizedStatus,
        authority,
      },
    );

    if (!payment) {
      throw new NotFoundException('Payment record not found.');
    }

    // Try to redirect to frontend receipt page; fall back to JSON
    const frontendUrl = process.env.FRONTEND_URL ?? process.env.APP_URL;
    if (frontendUrl && res) {
      const receiptUrl = `${frontendUrl.replace(/\/$/, '')}/payment/callback?paymentId=${encodeURIComponent(payment.id)}&Status=${encodeURIComponent(status ?? '')}${
        authority ? `&Authority=${encodeURIComponent(authority)}` : ''
      }`;
      return res.redirect(receiptUrl);
    }

    return payment;
  }

  @ApiBearerAuth('bearerAuth')
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Create Registration and Payment',
    description:
      'Creates a new event registration for the authenticated user and initiates a payment record.',
  })
  @ApiCreatedResponse({
    description:
      'Registration initiated, payment record created. Returns a payment object to redirect the user to the payment gateway.',
    type: PaymentDto,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid input data (e.g., validation error or capacity full).',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated.',
    type: ErrorResponseDto,
  })
  async createPayment(
    @CurrentUser() user: { sub: string },
    @Body() dto: CreatePaymentBodyDto,
  ): Promise<PaymentDto> {
    return this.paymentsService.createRegistrationAndPayment(user.sub, dto);
  }

  @ApiBearerAuth('bearerAuth')
  @UseGuards(JwtAuthGuard)
  @Get(':paymentId')
  @ApiOperation({
    summary: 'Get Payment Details',
    description: 'Retrieves the details and status of a single payment record.',
  })
  @ApiParam({ name: 'paymentId', type: String })
  @ApiOkResponse({ description: 'Payment details.', type: PaymentDto })
  @ApiNotFoundResponse({
    description: 'Payment record not found.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated.',
    type: ErrorResponseDto,
  })
  async getPaymentById(
    @Param('paymentId') paymentId: string,
    @CurrentUser() user: { sub: string },
  ): Promise<PaymentDto> {
    const payment = await this.paymentsService.getPaymentForUser(
      paymentId,
      user.sub,
    );
    if (!payment) {
      throw new NotFoundException('Payment record not found.');
    }
    return payment;
  }

  @ApiBearerAuth('bearerAuth')
  @UseGuards(JwtAuthGuard)
  @Post(':paymentId')
  @ApiOperation({
    summary: 'Verify Payment Status',
    description:
      'Endpoint for the frontend to confirm payment status after returning from the payment gateway.',
  })
  @ApiParam({ name: 'paymentId', type: String })
  @ApiBody({
    type: VerifyPaymentStatusDto,
    required: true,
  })
  @ApiOkResponse({ description: 'Payment status updated.', type: PaymentDto })
  @ApiNotFoundResponse({
    description: 'Payment record not found.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated.',
    type: ErrorResponseDto,
  })
  async verifyPaymentStatus(
    @Param('paymentId') paymentId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: VerifyPaymentStatusDto,
  ): Promise<PaymentDto> {
    const payment = await this.paymentsService.verifyPaymentStatus(
      paymentId,
      user.sub,
      dto,
    );
    if (!payment) {
      throw new NotFoundException('Payment record not found.');
    }
    return payment;
  }
}
