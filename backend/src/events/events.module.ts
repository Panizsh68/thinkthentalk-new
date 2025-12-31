import { Module } from '@nestjs/common';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { EventsRepository } from './events.repository';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { AdminEventsController } from './admin/admin-events.controller';
import { AuditModule } from '../infrastructure/audit/audit.module';
import { RedisModule } from '../infrastructure/cache/redis.module';

@Module({
  imports: [PrismaModule, AuditModule, RedisModule],
  providers: [EventsRepository, EventsService],
  controllers: [EventsController, AdminEventsController],
  exports: [EventsService],
})
export class EventsModule {}
