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
      host: configService.get<string>('DB_HOST'),
      port: configService.get<number>('DB_PORT'),
      user: configService.get<string>('DB_USER'),
      password: configService.get<string>('DB_PASSWORD'),
      database: configService.get<string>('DB_NAME'),
      connectionLimit: 10,
    };

    const adapter = new PrismaMariaDb(poolConfig);

    super({
      adapter,
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
    }
  }

  async beforeApplicationShutdown(): Promise<void> {
    await this.$disconnect().catch((error) =>
      this.logger.error('Error disconnecting Prisma', error),
    );
  }
}
