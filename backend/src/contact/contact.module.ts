import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { AdminContactController } from './admin-contact.controller';
import { ContactService } from './contact.service';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { MailerModule } from '../infrastructure/mailer/mailer.module';
import { InfrastructureConfigModule } from '../infrastructure/config/config.module';
import { ThrottlerStorageService } from '@nestjs/throttler';

@Module({
  imports: [PrismaModule, MailerModule, InfrastructureConfigModule],
  controllers: [ContactController, AdminContactController],
  providers: [ContactService, ThrottlerStorageService],
})
export class ContactModule {}
