import {
  Registration,
  Event,
  Payment,
  User,
  EventTicketConfig,
  EventResource,
  PaymentStatus,
  RegistrationStatus,
} from '@prisma/client';
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
import { toUserDto, toUserEntity } from '../../users/mappers/user.mapper';
import { PaymentDto } from '../../payments/dto/payment.dto';
import { parseLocalizedText } from '../../events/utils/localized-text.helper';
import { UserEntity } from '../../users/entities/user.entity';

const toDate = (value: unknown): Date => {
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
    registration.status as RegistrationStatus,
    registration.formData
      ? (JSON.parse(registration.formData as string) as Record<string, unknown>)
      : null,
    registration.payment?.id ?? null,
    toDate(registration.createdAt),
    toDate(registration.updatedAt),
  );

export const prismaToUserRegistrationEntity = (
  registration: Registration & {
    event: Pick<Event, 'title' | 'startDateTime'>;
    payment?: Pick<Payment, 'id'> | null;
  },
): UserRegistrationEntity =>
  new UserRegistrationEntity(
    registration.id,
    registration.userId,
    registration.eventId,
    registration.payment?.id ?? null,
    registration.ticketType,
    registration.status as RegistrationStatus,
    toDate(registration.createdAt),
    {
      title: parseLocalizedText(registration.event.title),
      startDateTime: toDate(registration.event.startDateTime),
    },
  );

export const prismaToUserRegistrationDetailsEntity = (
  registration: Registration & {
    user: User;
    event: Event & {
      ticketConfigs: EventTicketConfig[];
      resources: EventResource[];
    };
    payment: Payment | null;
  },
): UserRegistrationDetailsEntity =>
  new UserRegistrationDetailsEntity(
    registration.id,
    registration.userId,
    registration.eventId,
    registration.payment?.id ?? null,
    registration.ticketType,
    registration.status as RegistrationStatus,
    toDate(registration.createdAt),
    toUserEntity(registration.user),
    registration.formData
      ? (JSON.parse(registration.formData as string) as Record<string, any>)
      : null,
    prismaEventToEventEntity(registration.event),
    registration.payment,
  );

export const registrationFormDataFromJson = (
  json: unknown,
): RegistrationFormDataDto | null => {
  if (!json || typeof json !== 'object') return null;
  return json as RegistrationFormDataDto;
};

export const paymentToDto = (payment: Payment | null): PaymentDto | null => {
  if (!payment) return null;

  return {
    id: payment.id,
    registrationId: payment.registrationId,
    eventId: payment.eventId,
    ticketType: payment.ticketType,
    amount: payment.amount.toNumber(),
    currency: payment.currency,
    status: payment.status as PaymentStatus,
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
  user: toUserDto(entity.user as UserEntity),
  formData: registrationFormDataFromJson(entity.formData) ?? undefined,
  event: eventEntityToEventDto(entity.event),
  payment: entity.payment ? paymentToDto(entity.payment as Payment) : undefined,
});
