import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminStatsService } from './admin.stats.service';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { RedisModule } from '../infrastructure/cache/redis.module';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [AdminController, AdminUsersController],
  providers: [AdminStatsService, AdminUsersService],
})
export class AdminModule {}
