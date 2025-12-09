import { Injectable } from '@nestjs/common';
import { IAdminUserRepository } from './repositories/admin-user.repository';

@Injectable()
export class AdminService {
  constructor(private readonly adminUserRepository: IAdminUserRepository) {}

  status(): { status: string } {
    return { status: 'pending-implementation' };
  }
}
