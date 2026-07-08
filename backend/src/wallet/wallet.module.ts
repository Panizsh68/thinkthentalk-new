import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { ZarinpalGateway } from '../payments/providers/zarinpal.gateway';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [WalletController],
  providers: [WalletService, ZarinpalGateway],
  exports: [WalletService],
})
export class WalletModule {}
