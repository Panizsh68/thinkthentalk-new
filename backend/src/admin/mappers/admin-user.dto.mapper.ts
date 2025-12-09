import { AdminUserEntity } from '../entities/admin-user.entity';
import { AdminUserDto } from '../dto/admin-user.dto';

export const toAdminUserDto = (
  admin: AdminUserEntity,
): AdminUserDto => ({
  id: admin.id,
  email: admin.email,
  name: admin.name,
  role: admin.role,
});
