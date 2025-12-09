import { Body, Controller, Get, Param, Post, UseGuards, NotFoundException } from '@nestjs/common';
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
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

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
    description: 'Invalid input data (e.g., validation error or capacity full).',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  async createPayment(
    @CurrentUser() user: { sub: string },
    @Body() dto: CreatePaymentBodyDto,
  ): Promise<PaymentDto> {
    return this.paymentsService.createRegistrationAndPayment(user.sub, dto);
  }

  @Get(':paymentId')
  @ApiOperation({
    summary: 'Get Payment Details',
    description: 'Retrieves the details and status of a single payment record.',
  })
  @ApiParam({ name: 'paymentId', type: String })
  @ApiOkResponse({ description: 'Payment details.', type: PaymentDto })
  @ApiNotFoundResponse({ description: 'Payment record not found.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  async getPaymentById(
    @Param('paymentId') paymentId: string,
    @CurrentUser() user: { sub: string },
  ): Promise<PaymentDto> {
    const payment = await this.paymentsService.getPaymentForUser(paymentId, user.sub);
    if (!payment) {
      throw new NotFoundException('Payment record not found.');
    }
    return payment;
  }

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
  @ApiNotFoundResponse({ description: 'Payment record not found.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  async verifyPaymentStatus(
    @Param('paymentId') paymentId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: VerifyPaymentStatusDto,
  ): Promise<PaymentDto> {
    const payment = await this.paymentsService.verifyPaymentStatus(paymentId, user.sub, dto);
    if (!payment) {
      throw new NotFoundException('Payment record not found.');
    }
    return payment;
  }
}
