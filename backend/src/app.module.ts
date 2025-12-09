import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { ContentModule } from './content/content.module';
import { DiscountsModule } from './discounts/discounts.module';
import { EventsModule } from './events/events.module';
import { FeedbackModule } from './feedback/feedback.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { MessagingModule } from './messaging/messaging.module';
import { PaymentsModule } from './payments/payments.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { UsersModule } from './users/users.module';
import { UploadModule } from './upload/upload.module';
import { ContactModule } from './contact/contact.module';

@Module({
  imports: [
    ServeStaticModule.forRoot(
      {
        // Serve from project-level uploads directory (not dist/)
        rootPath: path.join(process.cwd(), 'uploads'),
        serveRoot: '/uploads',
      },
      {
        rootPath: path.join(process.cwd(), 'uploads'),
        serveRoot: '/images',
        serveStaticOptions: {
          index: false,
        },
      },
    ),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: Number(configService.get('THROTTLE_TTL') ?? 900), // default 15 minutes
          limit: Number(configService.get('THROTTLE_LIMIT') ?? 100),
        },
      ],
    }),
    InfrastructureModule,
    CommonModule,
    AuthModule,
    UsersModule,
    EventsModule,
    RegistrationsModule,
    PaymentsModule,
    DiscountsModule,
    ContentModule,
    FeedbackModule,
    MessagingModule,
    AdminModule,
    ContactModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
