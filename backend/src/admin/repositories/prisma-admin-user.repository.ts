import { Injectable } from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AdminUserEntity } from '../entities/admin-user.entity';
import { toAdminUserEntity } from '../mappers/admin-user.mapper';
import {
  CreateAdminUserDto,
  IAdminUserRepository,
  UpdateAdminUserDto,
} from './admin-user.repository';

@Injectable()
export class PrismaAdminUserRepository extends IAdminUserRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<AdminUserEntity | null> {
    const admin = await this.prisma.adminUser.findUnique({ where: { id } });
    return admin ? toAdminUserEntity(admin) : null;
  }

  async findByEmail(email: string): Promise<AdminUserEntity | null> {
    const admin = await this.prisma.adminUser.findUnique({ where: { email } });
    return admin ? toAdminUserEntity(admin) : null;
  }

  async create(data: CreateAdminUserDto): Promise<AdminUserEntity> {
    const admin = await this.prisma.adminUser.create({ data: { ...data, password: '' } });
    return toAdminUserEntity(admin);
  }

  async update(id: string, data: UpdateAdminUserDto): Promise<AdminUserEntity> {
    const admin = await this.prisma.adminUser.update({
      where: { id },
      data: {
        role: data.role ?? undefined,
        password: data.passwordHash ?? undefined,
      },
    });
    return toAdminUserEntity(admin);
  }
}
