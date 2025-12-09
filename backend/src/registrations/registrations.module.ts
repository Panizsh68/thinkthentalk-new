import { Module } from '@nestjs/common';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { UsersModule } from '../users/users.module';
import { EventsModule } from '../events/events.module';
import { RegistrationsRepository } from './registrations.repository';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';
import { AdminRegistrationsController } from './admin-registrations.controller';
import { AuditModule } from '../infrastructure/audit/audit.module';

@Module({
  imports: [PrismaModule, UsersModule, EventsModule, AuditModule],
  providers: [RegistrationsRepository, RegistrationsService],
  controllers: [RegistrationsController, AdminRegistrationsController],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
