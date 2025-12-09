import { Module } from '@nestjs/common';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { IUserRepository } from './repositories/user.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    UsersService,
    {
      provide: IUserRepository,
      useClass: PrismaUserRepository,
    },
  ],
  controllers: [UsersController],
  exports: [IUserRepository],
})
export class UsersModule {}
