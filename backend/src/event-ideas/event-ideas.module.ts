import { Module } from '@nestjs/common';
import { EventIdeasController } from './event-ideas.controller';
import { EventIdeasService } from './event-ideas.service';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [EventIdeasController],
  providers: [EventIdeasService],
})
export class EventIdeasModule {}
