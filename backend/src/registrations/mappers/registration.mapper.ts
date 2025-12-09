import { Registration, Event, Payment, User } from '@prisma/client';
import { RegistrationFormDataDto } from '../dto/registration-form-data.dto';
import { RegistrationEntity, UserRegistrationDetailsEntity, UserRegistrationEntity } from '../domain/registration.entity';
import { eventEntityToEventDto } from '../../events/mappers/event.mapper';
import { toUserDto } from '../../users/mappers/user.mapper';
import { PaymentDto } from '../../payments/dto/payment.dto';
import { parseLocalizedText } from '../../events/utils/localized-text.helper';

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
    registration.createdAt,
    registration.updatedAt,
  );

export const prismaToUserRegistrationEntity = (
  registration: Registration & { event: Pick<Event, 'title' | 'startDateTime'>; paymentId?: string | null },
): UserRegistrationEntity =>
  new UserRegistrationEntity(
    registration.id,
    registration.userId,
    registration.eventId,
    (registration as any).paymentId ?? null,
    registration.ticketType,
    registration.status,
    registration.createdAt,
    {
      title: parseLocalizedText(registration.event.title),
      startDateTime: registration.event.startDateTime,
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
    registration.createdAt,
    registration.user,
    (registration as any).formData ?? null,
    registration.event,
    registration.payment,
  );

export const registrationFormDataFromJson = (json: any): RegistrationFormDataDto | null => {
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
    amount: (payment.amount as any)?.toNumber ? (payment.amount as any).toNumber() : (payment.amount as any),
    currency: payment.currency,
    status: payment.status,
    gatewayTransactionId: payment.gatewayTransactionId ?? undefined,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
};

export const userRegistrationEntityToDto = (entity: UserRegistrationEntity) => ({
  id: entity.id,
  userId: entity.userId,
  eventId: entity.eventId,
  paymentId: entity.paymentId ?? undefined,
  ticketType: entity.ticketType,
  status: entity.status,
  createdAt: entity.createdAt.toISOString(),
  event: {
    title: entity.event.title,
    startDateTime: entity.event.startDateTime.toISOString(),
  },
});

export const userRegistrationDetailsEntityToDto = (entity: UserRegistrationDetailsEntity) => ({
  id: entity.id,
  userId: entity.userId,
  eventId: entity.eventId,
  paymentId: entity.paymentId ?? undefined,
  ticketType: entity.ticketType,
  status: entity.status,
  createdAt: entity.createdAt.toISOString(),
  user: toUserDto(entity.user),
  formData: registrationFormDataFromJson(entity.formData) ?? undefined,
  event: eventEntityToEventDto(entity.event as any),
  payment: entity.payment ? paymentToDto(entity.payment) : undefined,
});
