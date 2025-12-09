import { SetMetadata } from '@nestjs/common';
import { AdminRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export type Role = AdminRole;

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
