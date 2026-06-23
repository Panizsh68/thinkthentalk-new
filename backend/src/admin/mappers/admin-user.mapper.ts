import { AdminUser } from '@prisma/client';
import { AdminUserEntity } from '../entities/admin-user.entity';

export const toAdminUserEntity = (admin: AdminUser): AdminUserEntity =>
  new AdminUserEntity(
    admin.id,
    admin.email, // using email as name
    admin.email,
    admin.role,
    admin.password,
    admin.createdAt,
    admin.updatedAt,
  );