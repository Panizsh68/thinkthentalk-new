import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  Currency,
  PaymentStatus,
  TicketType,
  Prisma,
  RegistrationStatus,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { CreatePaymentBodyDto } from './dto/create-payment-body.dto';
import { PaymentDto } from './dto/payment.dto';
import { ZarinpalGateway } from './providers/zarinpal.gateway';
import { IppanelService } from '../infrastructure/sms/ippanel.service';
import type { RequestPaymentResult } from './providers/payment-gateway.interface';
import { VerifyPaymentStatusDto } from './dto/verify-payment-status.dto';
import { parseLocalizedText } from '../events/utils/localized-text.helper';
import { getTicketSaleWindows } from '../events/utils/ticket-sale-window.helper';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly zarinpalGateway: ZarinpalGateway,
    private readonly ippanelService: IppanelService,
    private readonly configService: ConfigService,
  ) {}

  async listAdminPayments(filters: {
    eventId?: string;
    status?: PaymentStatus;
  }): Promise<PaymentDto[]> {
    const payments = await this.prisma.payment.findMany({
      where: {
        ...(filters.eventId ? { eventId: filters.eventId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return payments.map((p) => this.toPaymentDto(p));
  }

  async getPaymentForUser(
    paymentId: string,
    userId: string,
  ): Promise<PaymentDto | null> {
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
    const userProfileUpdate = this.userProfileUpdateFromFormData(dto.formData);
    const shouldUpdateUserProfile = Object.values(userProfileUpdate).some(
      (value) => value !== undefined,
    );

    if (shouldUpdateUserProfile) {
      await this.prisma.user.update({
        where: { id: userId },
        data: userProfileUpdate,
      });
    }

    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
      include: { ticketConfigs: true },
    });
    if (!event) {
      throw new BadRequestException('Event not found');
    }

    const ticketConfig = event.ticketConfigs.find(
      (t) => t.type === dto.ticketType,
    );
    if (!ticketConfig) {
      throw new BadRequestException('Invalid ticket type for event');
    }

    const saleWindows = await getTicketSaleWindows(
      this.prisma,
      event.ticketConfigs.map((ticket) => ticket.id),
    );
    const ticketWindow = saleWindows.get(ticketConfig.id);
    const saleStartDate = ticketWindow?.saleStartDate ?? event.startDateTime;
    const saleEndDate =
      ticketWindow?.saleEndDate ??
      event.endDateTime ??
      new Date(
        new Date(event.startDateTime).getTime() + 30 * 24 * 60 * 60 * 1000,
      );
    const now = new Date();

    if (saleStartDate && now < new Date(saleStartDate)) {
      throw new BadRequestException('Ticket sales have not started yet.');
    }
    if (saleEndDate && now > new Date(saleEndDate)) {
      throw new BadRequestException('Ticket sales period has ended.');
    }

    if (event.capacityRemaining <= 0) {
      throw new BadRequestException('Event capacity is full');
    }

    if (ticketConfig.quantitySold >= ticketConfig.quantityTotal) {
      throw new BadRequestException('Ticket type is sold out');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, mobile: true },
    });

    const existingRegistration = await this.prisma.registration.findFirst({
      where: {
        userId,
        eventId: dto.eventId,
        status: { not: RegistrationStatus.CANCELLED },
      },
      include: { payment: true },
      orderBy: { createdAt: 'desc' },
    });

    const totalAmount = ticketConfig.price.toNumber
      ? ticketConfig.price.toNumber()
      : Number(ticketConfig.price);
    const amount = Math.round(dto.amount);

    if (amount < 0 || amount > totalAmount) {
      throw new BadRequestException('Invalid amount');
    }

    const gatewayMinAmount = dto.currency === Currency.TOMAN ? 1000 : 10000;
    if (amount > 0 && amount < gatewayMinAmount) {
      throw new BadRequestException(
        'Amount is below the minimum allowed for payment gateway.',
      );
    }

    const isFree = amount === 0;
    if (
      existingRegistration &&
      existingRegistration.status === RegistrationStatus.PAID
    ) {
      throw new BadRequestException(
        'You have already registered for this event.',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const registration =
        existingRegistration &&
        existingRegistration.status !== RegistrationStatus.CANCELLED
          ? await tx.registration.update({
              where: { id: existingRegistration.id },
              data: {
                ticketType: dto.ticketType,
                status: isFree
                  ? RegistrationStatus.PAID
                  : RegistrationStatus.PENDING,
                formData: JSON.stringify(dto.formData),
              },
            })
          : await (async () => {
              const reg = await tx.registration.create({
                data: {
                  userId,
                  eventId: dto.eventId,
                  ticketType: dto.ticketType,
                  status: isFree
                    ? RegistrationStatus.PAID
                    : RegistrationStatus.PENDING,
                  formData: JSON.stringify(dto.formData),
                } as Prisma.RegistrationUncheckedCreateInput,
              });

              await tx.event.update({
                where: { id: dto.eventId },
                data: { capacityRemaining: { decrement: 1 } },
              });

              await tx.eventTicketConfig.update({
                where: { id: ticketConfig.id },
                data: { quantitySold: { increment: 1 } },
              });

              return reg;
            })();

      const payment =
        existingRegistration?.payment &&
        existingRegistration.status !== RegistrationStatus.CANCELLED
          ? await tx.payment.update({
              where: { id: existingRegistration.payment.id },
              data: {
                amount,
                currency: dto.currency,
                ticketType: dto.ticketType,
                status: isFree ? PaymentStatus.SUCCESS : PaymentStatus.PENDING,
                gatewayTransactionId: null,
              },
            })
          : await tx.payment.create({
              data: {
                registrationId: registration.id,
                eventId: dto.eventId,
                ticketType: dto.ticketType,
                amount,
                currency: dto.currency,
                status: isFree ? PaymentStatus.SUCCESS : PaymentStatus.PENDING,
              },
            });

      await tx.registration.update({
        where: { id: registration.id },
        data: { payment: { connect: { id: payment.id } } },
      });

      return { registration, payment };
    });

    if (isFree) {
      // Send success SMS for free registration
      this.sendRegistrationSms(user?.mobile, event);
      return this.toPaymentDto(result.payment, { redirectUrl: undefined });
    }

    const eventTitle = parseLocalizedText(event.title);
    const callbackBase = this.configService.get<string>(
      'ZARINPAL_CALLBACK_URL',
    );
    if (!callbackBase) {
      throw new BadRequestException('Payment gateway is not configured');
    }

    let callbackUrl: string;
    try {
      const url = new URL(callbackBase);
      url.searchParams.set('paymentId', result.payment.id);
      callbackUrl = url.toString();
    } catch {
      throw new BadRequestException('Payment gateway callback URL is invalid');
    }

    let requestResult: RequestPaymentResult | null = null;
    try {
      requestResult = await this.zarinpalGateway.requestPayment({
        amount,
        currency: dto.currency,
        description: `Payment for event ${eventTitle.en ?? eventTitle.fa ?? ''}`,
        callbackUrl,
        metadata: {
          email: user?.email,
          mobile: user?.mobile,
          order_id: result.payment.id,
        },
      });
    } catch (error) {
      this.logger.error(
        `Zarinpal requestPayment failed for payment=${result.payment.id}`,
        error,
      );

      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: result.payment.id },
          data: { status: PaymentStatus.FAILED },
        });
        await tx.registration.update({
          where: { id: result.registration.id },
          data: { status: RegistrationStatus.FAILED },
        });
        await tx.event.update({
          where: { id: dto.eventId },
          data: { capacityRemaining: { increment: 1 } },
        });
        await tx.eventTicketConfig.update({
          where: { id: ticketConfig.id },
          data: { quantitySold: { decrement: 1 } },
        });
      });
      throw new BadRequestException(
        'Could not initiate payment. Please try again.',
      );
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id: result.payment.id },
      data: {
        gatewayTransactionId:
          requestResult.authority ?? result.payment.gatewayTransactionId,
      },
    });

    return this.toPaymentDto(updatedPayment, {
      redirectUrl: requestResult.url,
    });
  }

  async verifyPaymentStatusPublic(
    paymentId: string,
    dto: { status: 'SUCCESS' | 'FAILED'; authority?: string | null },
  ): Promise<PaymentDto | null> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId },
      include: { registration: { include: { user: true } }, event: true },
    });
    if (!payment) return null;

    const amount =
      typeof payment.amount === 'number'
        ? payment.amount
        : payment.amount.toNumber();

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

    const verification = await this.zarinpalGateway.verifyPayment({
      authority: dto.authority ?? payment.gatewayTransactionId ?? payment.id,
      amount,
    });

    const isSuccess = verification.success === true;

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
          gatewayTransactionId:
            verification.referenceId ?? payment.gatewayTransactionId,
        },
      });
      await tx.registration.update({
        where: { id: payment.registrationId },
        data: {
          status: isSuccess
            ? RegistrationStatus.PAID
            : RegistrationStatus.FAILED,
        },
      });
      return p;
    });

    if (isSuccess && payment.registration?.user?.mobile) {
      this.sendRegistrationSms(payment.registration.user.mobile, payment.event);
    }

    return this.toPaymentDto(updated);
  }

  private async sendRegistrationSms(mobile?: string | null, event?: any) {
    if (!mobile || !event) return;
    
    const eventTitle = parseLocalizedText(event.title).fa || parseLocalizedText(event.title).en;
    const eventLink = `thinkthentalk.ir/events/${event.slug || event.id}`;
    
    this.ippanelService.sendPatternSms(mobile, 'register-event', {
      event: eventTitle,
      eventLink,
    }).catch(err => this.logger.error('Failed to send registration SMS', err));
  }

  async verifyPaymentStatus(
    paymentId: string,
    userId: string,
    dto: VerifyPaymentStatusDto,
  ): Promise<PaymentDto | null> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, registration: { userId } },
      include: { registration: { include: { user: true } }, event: true },
    });

    if (!payment) return null;

    const amount =
      typeof payment.amount === 'number'
        ? payment.amount
        : payment.amount.toNumber();

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
          gatewayTransactionId:
            verification.referenceId ?? payment.gatewayTransactionId,
        },
      });
      await tx.registration.update({
        where: { id: payment.registrationId },
        data: {
          status: isSuccess
            ? RegistrationStatus.PAID
            : RegistrationStatus.FAILED,
        },
      });
      return p;
    });

    if (isSuccess && payment.registration?.user?.mobile) {
      this.sendRegistrationSms(payment.registration.user.mobile, payment.event);
    }

    return this.toPaymentDto(updated);
  }

  async getPaymentPublic(
    paymentId: string,
    options?: { status?: 'SUCCESS' | 'FAILED'; authority?: string | null },
  ): Promise<PaymentDto | null> {
    if (options?.status === 'SUCCESS' || options?.status === 'FAILED') {
      const verified = await this.verifyPaymentStatusPublic(paymentId, {
        status: options.status,
        authority: options.authority,
      });
      if (verified) return verified;
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) return null;

    return this.toPaymentDto(payment);
  }

  private userProfileUpdateFromFormData(
    formData: CreatePaymentBodyDto['formData'],
  ): Prisma.UserUpdateInput {
    const placeholders = [
      'نام',
      'نام خانوادگی',
      'name',
      'first name',
      'last name',
    ];
    const cleanName = (value?: string | null): string | undefined => {
      if (!value) return undefined;
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      if (placeholders.includes(trimmed.toLowerCase())) return undefined;
      return trimmed;
    };

    const cleanString = (value?: any): string | undefined => {
      if (value === null || value === undefined) return undefined;
      const trimmed = String(value).trim();
      return trimmed ? trimmed : undefined;
    };

    const cleanNumber = (value?: any): number | undefined => {
      if (value === null || value === undefined) return undefined;
      const num = Number(value);
      return Number.isFinite(num) ? num : undefined;
    };

    return {
      firstNameFa: cleanName(formData.firstNameFa),
      lastNameFa: cleanName(formData.lastNameFa),
      firstNameEn: cleanName(formData.firstNameEn),
      lastNameEn: cleanName(formData.lastNameEn),
      gender: formData.gender ?? undefined,
      age: cleanNumber(formData.age),
      educationLevel: cleanString(formData.educationLevel),
      fieldOfStudy: cleanString(formData.fieldOfStudy),
      isEmployed:
        typeof formData.isEmployed === 'boolean'
          ? formData.isEmployed
          : undefined,
      jobTitle: cleanString(formData.jobTitle),
      email: cleanString(formData.email),
      languageLevel: cleanString(formData.languageLevel),
    };
  }

  private toPaymentDto(
    payment: {
      id: string;
      registrationId: string;
      eventId: string;
      ticketType: TicketType;
      amount: Prisma.Decimal;
      currency: Currency;
      status: PaymentStatus;
      gatewayTransactionId?: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
    options?: { redirectUrl?: string },
  ): PaymentDto {
    const redirectUrl =
      options?.redirectUrl ??
      (payment.status === PaymentStatus.PENDING && payment.gatewayTransactionId
        ? this.zarinpalGateway.getPaymentUrl(payment.gatewayTransactionId)
        : undefined);

    return {
      id: payment.id,
      registrationId: payment.registrationId,
      eventId: payment.eventId,
      ticketType: payment.ticketType,
      amount: payment.amount.toNumber(),
      currency: payment.currency,
      status: payment.status,
      gatewayTransactionId: payment.gatewayTransactionId ?? undefined,
      redirectUrl,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };
  }
}
