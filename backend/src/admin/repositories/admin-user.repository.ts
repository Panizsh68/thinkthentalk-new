import { AdminUserEntity } from '../entities/admin-user.entity';
import { AdminRole } from '@prisma/client';

export interface CreateAdminUserDto {
  email: string;
  name: string;
  role: AdminRole;
  passwordHash: string;
}

export interface UpdateAdminUserDto {
  name?: string;
  role?: AdminRole;
  passwordHash?: string;
}

export abstract class IAdminUserRepository {
  abstract findById(id: string): Promise<AdminUserEntity | null>;
  abstract findByEmail(email: string): Promise<AdminUserEntity | null>;
  abstract create(data: CreateAdminUserDto): Promise<AdminUserEntity>;
  abstract update(
    id: string,
    data: UpdateAdminUserDto,
  ): Promise<AdminUserEntity>;
}
