import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { toUserEntity } from '../mappers/user.mapper';
import { UserEntity } from '../entities/user.entity';
import {
  CreateOrUpdateUserProfileDto,
  IUserRepository,
  UpdateUserProfileDto,
} from './user.repository';

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
        firstNameFa: dto.firstNameFa ?? undefined,
        lastNameFa: dto.lastNameFa ?? undefined,
        firstNameEn: dto.firstNameEn ?? undefined,
        lastNameEn: dto.lastNameEn ?? undefined,
        gender: dto.gender ?? undefined,
        age: dto.age ?? undefined,
        educationLevel: dto.educationLevel ?? undefined,
        fieldOfStudy: dto.fieldOfStudy ?? undefined,
        isEmployed: dto.isEmployed ?? undefined,
        jobTitle: dto.jobTitle ?? undefined,
        email: dto.email ?? undefined,
        languageLevel: dto.languageLevel ?? undefined,
      },
      create: {
        mobile: dto.mobile,
        firstNameFa: dto.firstNameFa ?? 'نام',
        lastNameFa: dto.lastNameFa ?? 'نام خانوادگی',
        firstNameEn: dto.firstNameEn,
        lastNameEn: dto.lastNameEn,
        gender: dto.gender ?? undefined,
        age: dto.age,
        educationLevel: dto.educationLevel,
        fieldOfStudy: dto.fieldOfStudy,
        isEmployed: dto.isEmployed,
        jobTitle: dto.jobTitle,
        email: dto.email,
        languageLevel: dto.languageLevel,
      },
    });

    return toUserEntity(user);
  }

  async updateProfile(id: string, dto: UpdateUserProfileDto): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        firstNameFa: dto.firstNameFa ?? undefined,
        lastNameFa: dto.lastNameFa ?? undefined,
        firstNameEn: dto.firstNameEn ?? undefined,
        lastNameEn: dto.lastNameEn ?? undefined,
        gender: dto.gender ?? undefined,
        age: dto.age ?? undefined,
        educationLevel: dto.educationLevel ?? undefined,
        fieldOfStudy: dto.fieldOfStudy ?? undefined,
        isEmployed: dto.isEmployed ?? undefined,
        jobTitle: dto.jobTitle ?? undefined,
        email: dto.email ?? undefined,
        languageLevel: dto.languageLevel ?? undefined,
      },
    });

    return toUserEntity(user);
  }
}
