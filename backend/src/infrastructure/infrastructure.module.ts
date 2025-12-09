import { Module } from '@nestjs/common';
import { RedisModule } from './cache/redis.module';
import { InfrastructureConfigModule } from './config/config.module';
import { PrismaModule } from './database/prisma.module';
import { PaymentsIntegrationModule } from './payments/payments.module';
import { SmsModule } from './sms/sms.module';
import { MailerModule } from './mailer/mailer.module';

@Module({
  imports: [
    InfrastructureConfigModule,
    RedisModule,
    PrismaModule,
    PaymentsIntegrationModule,
    SmsModule,
    MailerModule,
  ],
  exports: [
    InfrastructureConfigModule,
    RedisModule,
    PrismaModule,
    PaymentsIntegrationModule,
    SmsModule,
    MailerModule,
  ],
})
export class InfrastructureModule { }
