import { AdminUser } from '@prisma/client';
import { AdminUserEntity } from '../entities/admin-user.entity';

export const toAdminUserEntity = (admin: AdminUser): AdminUserEntity =>
  new AdminUserEntity(
    admin.id,
    admin.email,
    admin.name,
    admin.role,
    admin.passwordHash,
    admin.createdAt,
    admin.updatedAt,
  );
