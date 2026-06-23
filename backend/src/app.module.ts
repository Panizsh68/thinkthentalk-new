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
import { EventIdeasModule } from './event-ideas/event-ideas.module';
import { PartnershipsModule } from './partnerships/partnerships.module';
import { WalletModule } from './wallet/wallet.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [
    ServeStaticModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const configuredUploadDir = configService.get<string>('UPLOADS_DIR');
        const publicUploadPath =
          configService.get<string>('PUBLIC_UPLOAD_PATH') ?? '/images';
        const rootPath = configuredUploadDir
          ? path.resolve(configuredUploadDir)
          : path.join(process.cwd(), 'uploads');

        const serveRoots = Array.from(
          new Set([
            publicUploadPath.startsWith('/')
              ? publicUploadPath
              : `/${publicUploadPath}`,
            '/uploads',
            '/images',
          ]),
        );

        return serveRoots.map((serveRoot) => ({
          rootPath,
          serveRoot,
          serveStaticOptions: { index: false },
        }));
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: Number(configService.get('THROTTLE_TTL') ?? 900),
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
    EventIdeasModule,
    PartnershipsModule,
    WalletModule,
    SubscriptionModule,
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
export class AppModule {}
