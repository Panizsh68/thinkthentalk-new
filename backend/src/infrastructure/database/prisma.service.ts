
import {
  BeforeApplicationShutdown,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, BeforeApplicationShutdown
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    // Prefer the namespaced config which builds the URL from components
    let databaseUrl = configService.get<string>('database.url');

    // Fallback to top-level env var if registered config is unavailable
    if (!databaseUrl) {
      databaseUrl = configService.get<string>('DATABASE_URL');
    }

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: [
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Prisma connected to database');
    } catch (error) {
      this.logger.error('Error connecting Prisma to database', error);
      // We don't throw here to allow the app to start and the filter to catch subsequent query errors
    }
  }

  async beforeApplicationShutdown(): Promise<void> {
    await this.$disconnect().catch((error) =>
      this.logger.error('Error disconnecting Prisma', error),
    );
  }
}
