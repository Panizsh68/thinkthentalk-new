import { AdminRole } from '@prisma/client';

export class AdminUserEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly role: AdminRole,
    public readonly password?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
