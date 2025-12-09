import { Module } from '@nestjs/common';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { AuditModule } from '../infrastructure/audit/audit.module';
import { AdminDiscountsController } from './admin-discounts.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [DiscountsService],
  controllers: [DiscountsController, AdminDiscountsController],
})
export class DiscountsModule {}
