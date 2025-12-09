import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminStatsService } from './admin.stats.service';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { RedisModule } from '../infrastructure/cache/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [AdminController],
  providers: [AdminStatsService],
})
export class AdminModule {}
