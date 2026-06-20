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
    const host =
      configService.get<string>('database.host') ||
      configService.get<string>('DB_HOST') ||
      '127.0.0.1';
    const port = Number(
      configService.get<number>('database.port') ||
        configService.get<number>('DB_PORT') ||
        3306,
    );
    const user =
      configService.get<string>('database.user') ||
      configService.get<string>('DB_USER') ||
      'root';
    const password =
      configService.get<string>('database.password') ||
      configService.get<string>('DB_PASSWORD') ||
      '';
    const database =
      configService.get<string>('database.name') ||
      configService.get<string>('DB_NAME') ||
      'think_then_talk';

    const poolConfig: PoolConfig = {
      host,
      port,
      user,
      password,
      database,
      connectionLimit: 10,
      connectTimeout: 10000,
    };

    this.logger.log(
      `Initializing Prisma with MariaDB adapter for ${user}@${host}:${port}/${database}`,
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
