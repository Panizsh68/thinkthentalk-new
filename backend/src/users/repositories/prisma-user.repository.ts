import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { toUserEntity } from '../mappers/user.mapper';
import { UserEntity } from '../entities/user.entity';
import {
  CreateOrUpdateUserProfileDto,
  IUserRepository,
  UpdateUserProfileDto,
} from './user.repository';
import { Gender } from '@prisma/client';

const placeholders = ['نام', 'نام خانوادگی', 'name', 'first name', 'last name'];
const cleanName = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return placeholders.includes(trimmed.toLowerCase()) ? undefined : trimmed;
};

const cleanString = (value?: string | null): string | undefined => {
  if (value === null || value === undefined) return undefined;
  const trimmed = value.toString().trim();
  return trimmed || undefined;
};

@Injectable()
export class PrismaUserRepository extends IUserRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? toUserEntity(user) : null;
  }

  async findByMobile(mobile: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { mobile } });
    return user ? toUserEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({ where: { email } });
    return user ? toUserEntity(user) : null;
  }

  async createOrUpdateFromOtpProfile(
    dto: CreateOrUpdateUserProfileDto,
  ): Promise<UserEntity> {
    const normalizedMobile = cleanString(dto.mobile);
    const normalizedEmail = cleanString(dto.email)?.toLowerCase();

    const existingByMobile = normalizedMobile
      ? await this.prisma.user.findUnique({ where: { mobile: normalizedMobile } })
      : null;
    const existingByEmail = normalizedEmail
      ? await this.prisma.user.findFirst({ where: { email: normalizedEmail } })
      : null;

    const existingUser = existingByMobile ?? existingByEmail;

    if (existingUser) {
      await this.syncIdentityFields(existingUser.id, {
        email: normalizedEmail,
        mobile: normalizedMobile,
      });

      const user = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          firstNameFa: cleanName(dto.firstNameFa),
          lastNameFa: cleanName(dto.lastNameFa),
          firstNameEn: cleanName(dto.firstNameEn),
          lastNameEn: cleanName(dto.lastNameEn),
          gender: dto.gender as Gender || undefined,
          age: dto.age ?? undefined,
          educationLevel: cleanString(dto.educationLevel),
          fieldOfStudy: cleanString(dto.fieldOfStudy),
          isEmployed: dto.isEmployed ?? undefined,
          jobTitle: cleanString(dto.jobTitle),
          email: normalizedEmail,
          mobile: normalizedMobile,
          languageLevel: cleanString(dto.languageLevel),
        },
      });

      return toUserEntity(user);
    }

    const user = await this.prisma.user.create({
      data: {
        mobile: normalizedMobile ?? `otp-user-${Date.now()}`,
        firstNameFa: cleanName(dto.firstNameFa) ?? 'نام',
        lastNameFa: cleanName(dto.lastNameFa) ?? 'نام خانوادگی',
        firstNameEn: cleanName(dto.firstNameEn),
        lastNameEn: cleanName(dto.lastNameEn),
        gender: dto.gender as Gender || undefined,
        age: dto.age,
        educationLevel: cleanString(dto.educationLevel),
        fieldOfStudy: cleanString(dto.fieldOfStudy),
        isEmployed: dto.isEmployed,
        jobTitle: cleanString(dto.jobTitle),
        email: normalizedEmail,
        languageLevel: cleanString(dto.languageLevel),
      },
    });

    return toUserEntity(user);
  }

  async updateProfile(
    id: string,
    dto: UpdateUserProfileDto,
  ): Promise<UserEntity> {
    const normalizedEmail = cleanString(dto.email)?.toLowerCase();
    const normalizedMobile = cleanString(dto.mobile);

    await this.syncIdentityFields(id, {
      email: normalizedEmail,
      mobile: normalizedMobile,
    });

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        firstNameFa: cleanName(dto.firstNameFa),
        lastNameFa: cleanName(dto.lastNameFa),
        firstNameEn: cleanName(dto.firstNameEn),
        lastNameEn: cleanName(dto.lastNameEn),
        gender: dto.gender as Gender || undefined,
        age: dto.age ?? undefined,
        educationLevel: cleanString(dto.educationLevel),
        fieldOfStudy: cleanString(dto.fieldOfStudy),
        isEmployed: dto.isEmployed ?? undefined,
        jobTitle: cleanString(dto.jobTitle),
        email: normalizedEmail,
        mobile: normalizedMobile,
        languageLevel: cleanString(dto.languageLevel),
      },
    });

    return toUserEntity(user);
  }

  private async syncIdentityFields(
    userId: string,
    values: { email?: string | null; mobile?: string | null },
  ): Promise<void> {
    const normalizedEmail = cleanString(values.email)?.toLowerCase();
    const normalizedMobile = cleanString(values.mobile);

    if (normalizedEmail) {
      const duplicateEmailOwner = await this.prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          id: { not: userId },
        },
      });

      if (duplicateEmailOwner) {
        await this.prisma.user.update({
          where: { id: duplicateEmailOwner.id },
          data: { email: null },
        });
      }
    }

    if (normalizedMobile) {
      const duplicateMobileOwner = await this.prisma.user.findFirst({
        where: {
          mobile: normalizedMobile,
          id: { not: userId },
        },
      });

      if (duplicateMobileOwner) {
        await this.prisma.user.update({
          where: { id: duplicateMobileOwner.id },
          data: {
            mobile: `migrated-${duplicateMobileOwner.id}-${Date.now()}`,
          },
        });
      }
    }
  }

  async createUserWithEmailPassword(
    email: string,
    passwordHash: string,
  ): Promise<UserEntity> {
    // Generate a temporary unique value for mobile because it's required by schema but we don't have it for email signup
    const tempMobile = `email-user-${email}-${Date.now()}`;
    const user = await this.prisma.user.create({
      data: {
        email: email,
        password: passwordHash,
        mobile: tempMobile,
      },
    });
    return toUserEntity(user);
  }
}