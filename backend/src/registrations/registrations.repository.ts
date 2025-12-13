import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { prismaToUserRegistrationDetailsEntity, prismaToUserRegistrationEntity } from './mappers/registration.mapper';
import { UserRegistrationDetailsEntity, UserRegistrationEntity } from './domain/registration.entity';
import { Prisma } from '@prisma/client';

export interface AdminRegistrationFilter {
  userId?: string;
  eventId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class RegistrationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserRegistrations(userId: string): Promise<UserRegistrationEntity[]> {
    const registrations = await this.prisma.registration.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            title: true,
            startDateTime: true,
          },
        },
        payment: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return registrations.map(prismaToUserRegistrationEntity);
  }

  async findAllAdminRegistrations(
    filters: AdminRegistrationFilter,
  ): Promise<UserRegistrationDetailsEntity[]> {
    const registrations = await this.prisma.registration.findMany({
      where: {
        ...(filters.userId ? { userId: filters.userId } : {}),
        ...(filters.eventId ? { eventId: filters.eventId } : {}),
        ...(filters.status ? { status: filters.status as any } : {}),
      },
      include: {
        user: true,
        event: { include: { ticketConfigs: true, resources: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: filters.page && filters.limit ? (filters.page - 1) * filters.limit : undefined,
      take: filters.limit,
    });
    return registrations.map(prismaToUserRegistrationDetailsEntity);
  }

  async findByIdWithDetails(
    registrationId: string,
  ): Promise<UserRegistrationDetailsEntity | null> {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        user: true,
        event: { include: { ticketConfigs: true, resources: true } },
        payment: true,
      },
    });
    return registration ? prismaToUserRegistrationDetailsEntity(registration) : null;
  }

  async updateRegistration(
    registrationId: string,
    data: Partial<{
      status: string;
      paymentId: string | null;
      formData: any;
    }>,
  ): Promise<UserRegistrationDetailsEntity> {
    const updated = await this.prisma.registration.update({
      where: { id: registrationId },
      data: {
        status: data.status as any,
        payment: data.paymentId
          ? { connect: { id: data.paymentId } }
          : data.paymentId === null
            ? { disconnect: true }
            : undefined,
        formData:
          data.formData !== undefined
            ? (data.formData as Prisma.InputJsonValue)
            : undefined,
      },
      include: {
        user: true,
        event: { include: { ticketConfigs: true, resources: true } },
        payment: true,
      },
    });
    return prismaToUserRegistrationDetailsEntity(updated);
  }
}
