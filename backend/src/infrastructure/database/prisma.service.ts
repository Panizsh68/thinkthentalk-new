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
    const dbHost = configService.get<string>('DB_HOST') || '127.0.0.1';
    const dbPort = Number(configService.get<number>('DB_PORT') || 3306);
    const dbUser = configService.get<string>('DB_USER') || 'root';
    const dbPass = configService.get<string>('DB_PASSWORD') || '';
    const dbName = configService.get<string>('DB_NAME') || 'think_then_talk_dev';

    let poolConfig: PoolConfig;

    if (databaseUrl && databaseUrl.startsWith('mysql://')) {
      try {
        const url = new URL(databaseUrl);
        poolConfig = {
          host: url.hostname || dbHost,
          port: Number(url.port) || dbPort,
          user: url.username || dbUser,
          password: url.password || dbPass,
          database: url.pathname.replace(/^\//, '') || dbName,
          connectionLimit: 10,
          connectTimeout: 10000,
        };
      } catch (e) {
        this.logger.warn('Failed to parse DATABASE_URL, falling back to individual variables');
        poolConfig = {
          host: dbHost,
          port: dbPort,
          user: dbUser,
          password: dbPass,
          database: dbName,
          connectionLimit: 10,
          connectTimeout: 10000,
        };
      }
    } else {
      poolConfig = {
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPass,
        database: dbName,
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
