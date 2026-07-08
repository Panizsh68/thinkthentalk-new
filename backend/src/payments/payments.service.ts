import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  Currency,
  PaymentStatus,
  Prisma,
  RegistrationStatus,
  TicketType,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { CreatePaymentBodyDto } from './dto/create-payment-body.dto';
import { PaymentDto } from './dto/payment.dto';
import { ZarinpalGateway } from './providers/zarinpal.gateway';
import { IppanelService } from '../infrastructure/sms/ippanel.service';
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
      include: {
        registration: {
          include: {
            user: true,
            event: true,
          },
        },
      },
    });
    return payments.map((payment) =>
      this.toPaymentDto(payment, {
        eventTitle:
          parseLocalizedText(payment.registration?.event?.title ?? '').fa ||
          parseLocalizedText(payment.registration?.event?.title ?? '').en,
        userName: this.getDisplayName(payment.registration?.user),
        userMobile: payment.registration?.user?.mobile,
      }),
    );
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

    const isFree = amount === 0;
    if (
      existingRegistration &&
      existingRegistration.status === RegistrationStatus.PAID
    ) {
      throw new BadRequestException(
        'You have already registered for this event.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mobile: true, email: true },
    });

    const createPendingRegistrationAndPayment = async () => {
      return this.prisma.$transaction(async (tx) => {
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
                  status: isFree
                    ? PaymentStatus.SUCCESS
                    : PaymentStatus.PENDING,
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
    };

    if (isFree) {
      const result = await createPendingRegistrationAndPayment();
      this.sendRegistrationSms(user?.mobile, event);
      return this.toPaymentDto(result.payment);
    }

    const draft = await createPendingRegistrationAndPayment();
    const eventTitle = parseLocalizedText(event.title);
    const description = `Registration for ${eventTitle.en ?? eventTitle.fa ?? dto.eventId}`;
    const callbackUrl = this.buildRegistrationCallbackUrl(draft.payment.id);
    const requestResult = await this.zarinpalGateway.requestPayment({
      amount,
      currency: dto.currency,
      description,
      callbackUrl,
      metadata: {
        email: user?.email,
        mobile: user?.mobile,
      },
    });

    const updatedPayment = await this.prisma.payment.update({
      where: { id: draft.payment.id },
      data: {
        gatewayTransactionId: requestResult.authority,
      },
    });

    return this.toPaymentDto(updatedPayment);
  }

  async verifyPaymentStatusPublic(
    paymentId: string,
    dto: { status: 'SUCCESS' | 'FAILED'; authority?: string | null },
  ): Promise<PaymentDto | null> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId },
      include: { registration: { include: { user: true } } },
    });
    if (!payment) return null;

    const paymentEvent = await this.prisma.event.findUnique({
      where: { id: payment.eventId },
    });

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

    if (isSuccess && payment.registration?.user?.mobile && paymentEvent) {
      this.sendRegistrationSms(payment.registration.user.mobile, paymentEvent);
    }

    return this.toPaymentDto(updated);
  }

  private async sendRegistrationSms(mobile?: string | null, event?: any) {
    if (!mobile || !event) return;

    const eventTitle =
      parseLocalizedText(event.title).fa || parseLocalizedText(event.title).en;
    const eventLink = `thinkthentalk.ir/events/${event.slug || event.id}`;
    const patternCode =
      this.configService.get<string>('IPPANEL_REGISTER_EVENT_PATTERN_CODE') ||
      'kc0p2';

    this.ippanelService
      .sendPatternSms(mobile, patternCode, {
        event: eventTitle,
        eventLink,
      })
      .catch((err) =>
        this.logger.error('Failed to send registration SMS', err),
      );
  }

  async verifyPaymentStatus(
    paymentId: string,
    userId: string,
    dto: VerifyPaymentStatusDto,
  ): Promise<PaymentDto | null> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, registration: { userId } },
      include: { registration: { include: { user: true } } },
    });

    if (!payment) return null;

    const paymentEvent = await this.prisma.event.findUnique({
      where: { id: payment.eventId },
    });

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

    if (isSuccess && payment.registration?.user?.mobile && paymentEvent) {
      this.sendRegistrationSms(payment.registration.user.mobile, paymentEvent);
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

  private getDisplayName(
    user?: {
      firstNameFa?: string | null;
      lastNameFa?: string | null;
      firstNameEn?: string | null;
      lastNameEn?: string | null;
      mobile?: string | null;
    } | null,
  ): string | undefined {
    if (!user) return undefined;

    const placeholders = new Set([
      'نام',
      'نام خانوادگی',
      'نام نام خانوادگی',
      'name',
      'first name',
      'last name',
    ]);
    const candidates = [
      [user.firstNameFa, user.lastNameFa],
      [user.firstNameEn, user.lastNameEn],
    ];

    for (const [first, last] of candidates) {
      const fullName = [first, last].filter(Boolean).join(' ').trim();
      if (fullName && !placeholders.has(fullName.toLowerCase())) {
        return fullName;
      }
    }

    return user.mobile ?? undefined;
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
    options?: {
      redirectUrl?: string;
      eventTitle?: string;
      userName?: string;
      userMobile?: string | null;
    },
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
      eventTitle: options?.eventTitle,
      userName: options?.userName,
      userMobile: options?.userMobile ?? undefined,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };
  }

  private buildRegistrationCallbackUrl(paymentId: string) {
    const callbackBase = this.configService.get<string>(
      'ZARINPAL_CALLBACK_URL',
    );

    if (!callbackBase) {
      throw new BadRequestException('Payment gateway callback URL is missing');
    }

    let url: URL;
    try {
      url = new URL(callbackBase);
    } catch {
      throw new BadRequestException('Payment gateway callback URL is invalid');
    }

    url.searchParams.set('paymentId', paymentId);
    return url.toString();
  }
}
