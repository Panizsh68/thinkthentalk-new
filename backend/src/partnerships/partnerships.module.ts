
import { Module } from '@nestjs/common';
import { PartnershipsController } from './partnerships.controller';
import { PartnershipsService } from './partnerships.service';
import { PrismaModule } from '../infrastructure/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PartnershipsController],
  providers: [PartnershipsService],
})
export class PartnershipsModule {}
