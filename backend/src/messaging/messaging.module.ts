import { Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { AdminMessagingController } from './admin-messaging.controller';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { SmsModule } from '../infrastructure/sms/sms.module';
import { AuditModule } from '../infrastructure/audit/audit.module';

@Module({
  imports: [PrismaModule, SmsModule, AuditModule],
  providers: [MessagingService],
  controllers: [MessagingController, AdminMessagingController],
})
export class MessagingModule {}
