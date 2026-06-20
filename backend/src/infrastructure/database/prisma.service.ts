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
    const databaseUrl = configService.get<string>('DATABASE_URL');
    
    let poolConfig: PoolConfig;

    if (databaseUrl && databaseUrl.startsWith('mysql://')) {
      // Parse basic connection info from URL if possible, or use standard env keys
      // The PrismaMariaDb adapter prefers a structured config.
      const url = new URL(databaseUrl);
      poolConfig = {
        host: url.hostname || '127.0.0.1',
        port: Number(url.port) || 3306,
        user: url.username || 'root',
        password: url.password || '',
        database: url.pathname.replace(/^\//, '') || 'think_then_talk',
        connectionLimit: 10,
        connectTimeout: 10000,
      };
    } else {
      poolConfig = {
        host: configService.get<string>('DB_HOST') || '127.0.0.1',
        port: Number(configService.get<number>('DB_PORT') || 3306),
        user: configService.get<string>('DB_USER') || 'root',
        password: configService.get<string>('DB_PASSWORD') || '',
        database: configService.get<string>('DB_NAME') || 'think_then_talk',
        connectionLimit: 10,
        connectTimeout: 10000,
      };
    }

    this.logger.log(
      `Initializing Prisma with MariaDB adapter for ${poolConfig.user}@${poolConfig.host}:${poolConfig.port}/${poolConfig.database}`,
    );

    const adapter = new PrismaMariaDb(poolConfig);

    super({
      adapter,
      log: [
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Prisma successfully connected to database');
    } catch (error) {
      this.logger.error(
        'CRITICAL: Error connecting Prisma to database. Check DB availability and credentials.',
        error,
      );
    }
  }

  async beforeApplicationShutdown(): Promise<void> {
    await this.$disconnect().catch((error) =>
      this.logger.error('Error disconnecting Prisma', error),
    );
  }
}
