import { CacheModule } from '@nestjs/cache-manager';
import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisService } from './redis.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('RedisModule');
        const nodeEnv = (configService.get<string>('NODE_ENV') ?? 'development').toLowerCase();
        const requireRedis = nodeEnv === 'production';
        const ttlMs = Number(configService.get('CACHE_TTL_SECONDS') ?? 60) * 1000;
        const redisHost = configService.get<string>('redis.host');
        const redisPort = configService.get<number>('redis.port') ?? 6379;
        const redisPassword = configService.get<string>('redis.password');
        const redisUrl = configService.get<string>('redis.url');

        try {
          if (redisUrl) {
            const store = await redisStore({
              url: redisUrl,
              password: redisPassword,
            });
            logger.log(`Redis cache connected via url=${redisUrl}`);
            return { store, ttl: ttlMs };
          }

          if (redisHost) {
            const store = await redisStore({
              socket: {
                host: redisHost,
                port: redisPort,
              },
              password: redisPassword,
            });
            logger.log(`Redis cache connected via host=${redisHost} port=${redisPort}`);
            return { store, ttl: ttlMs };
          }
        } catch (error) {
          logger.warn(
            `Redis cache unavailable, falling back to in-memory store. Reason: ${(error as Error).message}`,
          );
          if (requireRedis) {
            throw error;
          }
        }

        if (requireRedis) {
          throw new Error('Redis configuration missing in production; cannot start with in-memory cache.');
        }
        logger.warn('Redis not configured; using in-memory cache store (development only).');
        return { ttl: ttlMs };
      },
    }),
  ],
  providers: [RedisService],
  exports: [CacheModule, RedisService],
})
export class RedisModule {}
