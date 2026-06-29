import {
  BeforeApplicationShutdown,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PoolConfig } from 'mariadb';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, BeforeApplicationShutdown
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    const poolConfig: PoolConfig = {
      host: configService.getOrThrow<string>('DB_HOST'),
      port: configService.getOrThrow<number>('DB_PORT'),
      user: configService.getOrThrow<string>('DB_USER'),
      password: configService.getOrThrow<string>('DB_PASSWORD'),
      database: configService.getOrThrow<string>('DB_NAME'),
      allowPublicKeyRetrieval: true,
    };

    const adapter = new PrismaMariaDb(poolConfig);
    super({ adapter, log: ['warn', 'error'] });

    this.logger.log('PrismaService initialized with MariaDB adapter.');
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma client connected successfully to the database.');
    } catch (error) {
      this.logger.error(
        'Failed to connect to the database on module init.',
        error,
      );
      throw error;
    }
  }

  async beforeApplicationShutdown(signal?: string) {
    this.logger.log(
      `Received ${signal || 'shutdown signal'}. Disconnecting Prisma client.`,
    );
    await this.$disconnect();
  }
}
