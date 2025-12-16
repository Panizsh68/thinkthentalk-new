import { Registration, Event, Payment, User } from '@prisma/client';
import { RegistrationFormDataDto } from '../dto/registration-form-data.dto';
import {
  RegistrationEntity,
  UserRegistrationDetailsEntity,
  UserRegistrationEntity,
} from '../domain/registration.entity';
import {
  eventEntityToEventDto,
  prismaEventToEventEntity,
} from '../../events/mappers/event.mapper';
import { toUserDto } from '../../users/mappers/user.mapper';
import { PaymentDto } from '../../payments/dto/payment.dto';
import { parseLocalizedText } from '../../events/utils/localized-text.helper';

const toDate = (value: any): Date => {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
};

export const prismaRegistrationToEntity = (
  registration: Registration & {
    payment?: Payment | null;
  },
): RegistrationEntity =>
  new RegistrationEntity(
    registration.id,
    registration.userId,
    registration.eventId,
    registration.ticketType,
    registration.status,
    (registration as any).formData ?? null,
    (registration as any).paymentId ?? null,
    toDate(registration.createdAt),
    toDate(registration.updatedAt),
  );

export const prismaToUserRegistrationEntity = (
  registration: Registration & {
    event: Pick<Event, 'title' | 'startDateTime'>;
    paymentId?: string | null;
    payment?: Pick<Payment, 'id'> | null;
  },
): UserRegistrationEntity =>
  new UserRegistrationEntity(
    registration.id,
    registration.userId,
    registration.eventId,
    registration.payment?.id ?? (registration as any).paymentId ?? null,
    registration.ticketType,
    registration.status,
    toDate(registration.createdAt),
    {
      title: parseLocalizedText(registration.event.title),
      startDateTime: toDate(registration.event.startDateTime),
    },
  );

export const prismaToUserRegistrationDetailsEntity = (
  registration: Registration & {
    user: User;
    event: Event & { ticketConfigs?: any; resources?: any };
    payment: Payment | null;
  },
): UserRegistrationDetailsEntity =>
  new UserRegistrationDetailsEntity(
    registration.id,
    registration.userId,
    registration.eventId,
    (registration as any).paymentId ?? null,
    registration.ticketType,
    registration.status,
    toDate(registration.createdAt),
    registration.user,
    (registration as any).formData ?? null,
    prismaEventToEventEntity({
      ...(registration.event as any),
      ticketConfigs: (registration.event as any).ticketConfigs ?? [],
      resources: (registration.event as any).resources ?? [],
    }),
    registration.payment,
  );

export const registrationFormDataFromJson = (
  json: any,
): RegistrationFormDataDto | null => {
  if (!json || typeof json !== 'object') return null;
  return json as RegistrationFormDataDto;
};

export const paymentToDto = (payment: Payment | null): PaymentDto | null => {
  if (!payment) return null;

  const toNumberSafe = (val: any): number => {
    try {
      if (val?.toNumber) return val.toNumber();
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    } catch {
      return 0;
    }
  };

  return {
    id: payment.id,
    registrationId: payment.registrationId,
    eventId: payment.eventId,
    ticketType: payment.ticketType,
    amount: toNumberSafe(payment.amount as any),
    currency: payment.currency,
    status: payment.status,
    gatewayTransactionId: payment.gatewayTransactionId ?? undefined,
    createdAt: toDate(payment.createdAt).toISOString(),
    updatedAt: toDate(payment.updatedAt).toISOString(),
  };
};

export const userRegistrationEntityToDto = (
  entity: UserRegistrationEntity,
) => ({
  id: entity.id,
  userId: entity.userId,
  eventId: entity.eventId,
  paymentId: entity.paymentId ?? undefined,
  ticketType: entity.ticketType,
  status: entity.status,
  createdAt: toDate(entity.createdAt).toISOString(),
  event: {
    title: entity.event.title,
    startDateTime: toDate(entity.event.startDateTime).toISOString(),
  },
});

export const userRegistrationDetailsEntityToDto = (
  entity: UserRegistrationDetailsEntity,
) => ({
  id: entity.id,
  userId: entity.userId,
  eventId: entity.eventId,
  paymentId: entity.paymentId ?? undefined,
  ticketType: entity.ticketType,
  status: entity.status,
  createdAt: toDate(entity.createdAt).toISOString(),
  user: toUserDto(entity.user),
  formData: registrationFormDataFromJson(entity.formData) ?? undefined,
  event: eventEntityToEventDto(entity.event),
  payment: entity.payment ? paymentToDto(entity.payment) : undefined,
});
