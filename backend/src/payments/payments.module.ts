import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ZarinpalGateway } from './providers/zarinpal.gateway';
import { AdminPaymentsController } from './admin-payments.controller';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [PaymentsService, ZarinpalGateway],
  controllers: [PaymentsController, AdminPaymentsController],
})
export class PaymentsModule {}
