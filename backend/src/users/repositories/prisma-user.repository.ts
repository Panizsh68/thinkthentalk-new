import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { toUserEntity } from '../mappers/user.mapper';
import { UserEntity } from '../entities/user.entity';
import {
  CreateOrUpdateUserProfileDto,
  IUserRepository,
  UpdateUserProfileDto,
} from './user.repository';

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

  async createOrUpdateFromOtpProfile(
    dto: CreateOrUpdateUserProfileDto,
  ): Promise<UserEntity> {
    const user = await this.prisma.user.upsert({
      where: { mobile: dto.mobile },
      update: {
        firstNameFa: cleanName(dto.firstNameFa),
        lastNameFa: cleanName(dto.lastNameFa),
        firstNameEn: cleanName(dto.firstNameEn),
        lastNameEn: cleanName(dto.lastNameEn),
        gender: dto.gender ?? undefined,
        age: dto.age ?? undefined,
        educationLevel: cleanString(dto.educationLevel),
        fieldOfStudy: cleanString(dto.fieldOfStudy),
        isEmployed: dto.isEmployed ?? undefined,
        jobTitle: cleanString(dto.jobTitle),
        email: cleanString(dto.email),
        languageLevel: cleanString(dto.languageLevel),
      },
      create: {
        mobile: dto.mobile,
        firstNameFa: cleanName(dto.firstNameFa) ?? 'نام',
        lastNameFa: cleanName(dto.lastNameFa) ?? 'نام خانوادگی',
        firstNameEn: cleanName(dto.firstNameEn),
        lastNameEn: cleanName(dto.lastNameEn),
        gender: dto.gender ?? undefined,
        age: dto.age,
        educationLevel: cleanString(dto.educationLevel),
        fieldOfStudy: cleanString(dto.fieldOfStudy),
        isEmployed: dto.isEmployed,
        jobTitle: cleanString(dto.jobTitle),
        email: cleanString(dto.email),
        languageLevel: cleanString(dto.languageLevel),
      },
    });

    return toUserEntity(user);
  }

  async updateProfile(
    id: string,
    dto: UpdateUserProfileDto,
  ): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        firstNameFa: cleanName(dto.firstNameFa),
        lastNameFa: cleanName(dto.lastNameFa),
        firstNameEn: cleanName(dto.firstNameEn),
        lastNameEn: cleanName(dto.lastNameEn),
        gender: dto.gender ?? undefined,
        age: dto.age ?? undefined,
        educationLevel: cleanString(dto.educationLevel),
        fieldOfStudy: cleanString(dto.fieldOfStudy),
        isEmployed: dto.isEmployed ?? undefined,
        jobTitle: cleanString(dto.jobTitle),
        email: cleanString(dto.email),
        languageLevel: cleanString(dto.languageLevel),
      },
    });

    return toUserEntity(user);
  }
}
