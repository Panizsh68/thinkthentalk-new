import { BadRequestException, Injectable } from '@nestjs/common';
import { Currency, PaymentStatus, TicketType, Prisma, RegistrationStatus } from '@prisma/client';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { CreatePaymentBodyDto } from './dto/create-payment-body.dto';
import { PaymentDto } from './dto/payment.dto';
import { ZarinpalGateway } from './providers/zarinpal.gateway';
import { VerifyPaymentStatusDto } from './dto/verify-payment-status.dto';
import { parseLocalizedText } from '../events/utils/localized-text.helper';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly zarinpalGateway: ZarinpalGateway,
  ) {}

  async listAdminPayments(filters: { eventId?: string; status?: PaymentStatus }): Promise<PaymentDto[]> {
    const payments = await this.prisma.payment.findMany({
      where: {
        ...(filters.eventId ? { eventId: filters.eventId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return payments.map((p) => this.toPaymentDto(p));
  }

  async getPaymentForUser(paymentId: string, userId: string): Promise<PaymentDto | null> {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        registration: { userId },
      },
    });
    if (!payment) {
      return null;
    }
    return this.toPaymentDto(payment);
  }

  async createRegistrationAndPayment(
    userId: string,
    dto: CreatePaymentBodyDto,
  ): Promise<PaymentDto> {
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
      include: { ticketConfigs: true },
    });
    if (!event) {
      throw new BadRequestException('Event not found');
    }

    const ticketConfig = event.ticketConfigs.find((t) => t.type === dto.ticketType);
    if (!ticketConfig) {
      throw new BadRequestException('Invalid ticket type for event');
    }

    if (event.capacityRemaining <= 0) {
      throw new BadRequestException('Event capacity is full');
    }

    if (ticketConfig.quantitySold >= ticketConfig.quantityTotal) {
      throw new BadRequestException('Ticket type is sold out');
    }

    const totalAmount =
      ticketConfig.price.toNumber ? ticketConfig.price.toNumber() : (ticketConfig.price as any);
    if (dto.amount !== totalAmount) {
      throw new BadRequestException('Invalid amount');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const registration = await tx.registration.create({
        data: {
          userId,
          eventId: dto.eventId,
          ticketType: dto.ticketType,
          status: PaymentStatus.PENDING,
          formData: dto.formData as unknown as Prisma.InputJsonValue,
        } as Prisma.RegistrationUncheckedCreateInput,
      });

      const payment = await tx.payment.create({
        data: {
          registrationId: registration.id,
          eventId: dto.eventId,
          ticketType: dto.ticketType,
          amount: dto.amount,
          currency: dto.currency,
          status: PaymentStatus.PENDING,
        },
      });

      await tx.event.update({
        where: { id: dto.eventId },
        data: { capacityRemaining: { decrement: 1 } },
      });

      await tx.eventTicketConfig.update({
        where: { id: ticketConfig.id },
        data: { quantitySold: { increment: 1 } },
      });

      return { registration, payment };
    });

    // Placeholder gateway call
    const eventTitle = parseLocalizedText(event.title);
    const requestResult = await this.zarinpalGateway.requestPayment({
      amount: dto.amount,
      description: `Payment for event ${eventTitle.en}`,
      callbackUrl: '',
    });

    const updatedPayment = await this.prisma.payment.update({
      where: { id: result.payment.id },
      data: {
        gatewayTransactionId: requestResult.authority ?? result.payment.gatewayTransactionId,
      },
    });

    return this.toPaymentDto(updatedPayment);
  }

  async verifyPaymentStatus(
    paymentId: string,
    userId: string,
    dto: VerifyPaymentStatusDto,
  ): Promise<PaymentDto | null> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, registration: { userId } },
      include: { registration: true },
    });

    if (!payment) {
      return null;
    }

    const amount =
      payment.amount && (payment.amount as any).toNumber
        ? (payment.amount as any).toNumber()
        : (payment.amount as any);

    if (dto.status === 'FAILED') {
      const updated = await this.prisma.$transaction(async (tx) => {
        const p = await tx.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED },
        });
        await tx.registration.update({
          where: { id: payment.registrationId },
          data: { status: RegistrationStatus.FAILED },
        });
        return p;
      });
      return this.toPaymentDto(updated);
    }

    // status === SUCCESS
    const verification = await this.zarinpalGateway.verifyPayment({
      authority: payment.gatewayTransactionId ?? payment.id,
      amount,
    });

    const isSuccess = verification.success === true;

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
          gatewayTransactionId: verification.referenceId ?? payment.gatewayTransactionId,
        },
      });
      await tx.registration.update({
        where: { id: payment.registrationId },
        data: {
          status: isSuccess ? RegistrationStatus.PAID : RegistrationStatus.FAILED,
        },
      });
      return p;
    });

    return this.toPaymentDto(updated);
  }

  private toPaymentDto(payment: {
    id: string;
    registrationId: string;
    eventId: string;
    ticketType: TicketType;
    amount: any;
    currency: Currency;
    status: PaymentStatus;
    gatewayTransactionId?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): PaymentDto {
    return {
      id: payment.id,
      registrationId: payment.registrationId,
      eventId: payment.eventId,
      ticketType: payment.ticketType,
      amount: payment.amount.toNumber ? payment.amount.toNumber() : (payment.amount as any),
      currency: payment.currency,
      status: payment.status,
      gatewayTransactionId: payment.gatewayTransactionId ?? undefined,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };
  }
}
