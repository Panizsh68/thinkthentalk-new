import { Injectable } from '@nestjs/common';
import {
  Gender,
  PaymentStatus,
  Prisma,
  RegistrationStatus,
  TicketType,
} from '@prisma/client';
import { PrismaService } from '../infrastructure/database/prisma.service';
import {
  AdminUserDetailsDto,
  AdminUserListItemDto,
  AdminUserRegistrationDto,
  AdminUserProfileDto,
} from './dto/admin-user.dto';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { parseLocalizedText } from '../events/utils/localized-text.helper';
import { registrationFormDataFromJson } from '../registrations/mappers/registration.mapper';

type CombinedProfile = {
  id: string;
  mobile: string;
  firstNameFa?: string;
  lastNameFa?: string;
  firstNameEn?: string | null;
  lastNameEn?: string | null;
  gender?: Gender | null;
  age?: number | null;
  educationLevel?: string | null;
  fieldOfStudy?: string | null;
  isEmployed?: boolean | null;
  jobTitle?: string | null;
  email?: string | null;
  languageLevel?: string | null;
};

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(query: AdminUsersQueryDto): Promise<AdminUserListItemDto[]> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 50;
    const search = query.search?.trim();

    const users = await this.prisma.user.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { mobile: { contains: search } },
                { firstNameFa: { contains: search } },
                { lastNameFa: { contains: search } },
                { email: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        _count: { select: { registrations: true } },
        registrations: {
          select: { createdAt: true, formData: true, status: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const results: AdminUserListItemDto[] = [];

    for (const user of users) {
      const latestForm = user.registrations?.[0]?.formData ?? null;
      const combinedProfile = this.mergeProfile(user, latestForm);
      const missingFields = this.getMissingFields(combinedProfile);
      const profileCompleted = missingFields.length === 0;

      if (query.profileStatus === 'complete' && !profileCompleted) continue;
      if (query.profileStatus === 'incomplete' && profileCompleted) continue;

      results.push({
        ...combinedProfile,
        id: user.id,
        mobile: combinedProfile.mobile ?? user.mobile,
        profileCompleted,
        missingFields,
        registrationCount: user._count?.registrations ?? 0,
        lastRegistrationAt: user.registrations?.[0]?.createdAt
          ? this.toISOString(user.registrations[0].createdAt)
          : null,
        createdAt: this.toISOString(user.createdAt),
      });
    }

    return results;
  }

  async getUserDetails(userId: string): Promise<AdminUserDetailsDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        registrations: {
          include: {
            event: { select: { id: true, title: true, startDateTime: true } },
            payment: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return null;
    }

    const latestForm = user.registrations?.[0]?.formData ?? null;
    const combinedProfile = this.mergeProfile(user, latestForm);
    const missingFields = this.getMissingFields(combinedProfile);
    const profileCompleted = missingFields.length === 0;

    const profile: AdminUserProfileDto = {
      ...combinedProfile,
      id: user.id,
      mobile: combinedProfile.mobile ?? user.mobile,
      profileCompleted,
      missingFields,
    };

    const registrations: AdminUserRegistrationDto[] = user.registrations.map(
      (reg) => {
        const parsedTitle = parseLocalizedText(reg.event.title);
        const formData = registrationFormDataFromJson(reg.formData);
        return {
          id: reg.id,
          eventId: reg.eventId,
          eventTitle: parsedTitle.fa ?? parsedTitle.en ?? '',
          eventStartDateTime: this.toISOString(reg.event.startDateTime),
          ticketType: reg.ticketType as TicketType,
          status: reg.status as RegistrationStatus,
          paymentStatus: reg.payment?.status ?? null,
          paymentId: reg.payment?.id ?? null,
          paymentAmount: this.toNumber(reg.payment?.amount),
          gatewayTransactionId: reg.payment?.gatewayTransactionId ?? null,
          createdAt: this.toISOString(reg.createdAt),
          formData: formData ?? undefined,
        };
      },
    );

    return { profile, registrations };
  }

  private mergeProfile(
    user: { [key: string]: any },
    formData?: Prisma.JsonValue | null,
  ): CombinedProfile {
    const form = (formData as Record<string, any>) ?? {};
    const pickString = (...values: Array<any>): string | undefined => {
      const placeholders = [
        'نام',
        'نام خانوادگی',
        'name',
        'first name',
        'last name',
      ];
      for (const value of values) {
        if (value === null || value === undefined) continue;
        const str = String(value).trim();
        if (!str) continue;
        if (placeholders.includes(str.toLowerCase())) continue;
        return str;
      }
      return undefined;
    };

    const pickNumber = (...values: Array<any>): number | undefined => {
      for (const value of values) {
        if (value === null || value === undefined) continue;
        const num = Number(value);
        if (Number.isFinite(num)) return num;
      }
      return undefined;
    };

    const pickBoolean = (...values: Array<any>): boolean | undefined => {
      for (const value of values) {
        if (typeof value === 'boolean') return value;
      }
      return undefined;
    };

    return {
      id: user.id,
      mobile: pickString(form.mobile, user.mobile) ?? user.mobile,
      firstNameFa: pickString(form.firstNameFa, user.firstNameFa),
      lastNameFa: pickString(form.lastNameFa, user.lastNameFa),
      firstNameEn: pickString(form.firstNameEn, user.firstNameEn),
      lastNameEn: pickString(form.lastNameEn, user.lastNameEn),
      gender: (form.gender ?? user.gender) as Gender | undefined,
      age: pickNumber(form.age, user.age),
      educationLevel: pickString(form.educationLevel, user.educationLevel),
      fieldOfStudy: pickString(form.fieldOfStudy, user.fieldOfStudy),
      isEmployed: pickBoolean(form.isEmployed, user.isEmployed),
      jobTitle: pickString(form.jobTitle, user.jobTitle),
      email: pickString(form.email, user.email),
      languageLevel: pickString(form.languageLevel, user.languageLevel),
    };
  }

  private getMissingFields(profile: CombinedProfile): string[] {
    const missing: string[] = [];
    const requiredStrings: Array<keyof CombinedProfile> = [
      'firstNameFa',
      'lastNameFa',
      'educationLevel',
      'languageLevel',
    ];

    requiredStrings.forEach((field) => {
      const value = profile[field];
      if (
        value === null ||
        value === undefined ||
        String(value).trim() === ''
      ) {
        missing.push(field as string);
      }
    });

    if (!profile.age || profile.age <= 0) {
      missing.push('age');
    }

    if (!profile.gender) {
      missing.push('gender');
    }

    if (profile.isEmployed === undefined || profile.isEmployed === null) {
      missing.push('isEmployed');
    } else if (
      profile.isEmployed &&
      (!profile.jobTitle || String(profile.jobTitle).trim() === '')
    ) {
      missing.push('jobTitle');
    }

    return missing;
  }

  private toISOString(value: any): string {
    if (value instanceof Date) return value.toISOString();
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }

  private toNumber(value: any): number | null {
    if (value === null || value === undefined) return null;
    try {
      if (value.toNumber) return value.toNumber();
    } catch {
      /* ignore */
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
}
