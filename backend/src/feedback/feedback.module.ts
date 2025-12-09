import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { AdminFeedbackController } from './admin-feedback.controller';

@Module({
  imports: [PrismaModule],
  providers: [FeedbackService],
  controllers: [FeedbackController, AdminFeedbackController],
})
export class FeedbackModule {}
