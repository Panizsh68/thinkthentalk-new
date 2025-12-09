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
        const ttl = Number(configService.get('CACHE_TTL_SECONDS') ?? 60);
        const redisHost = configService.get<string>('redis.host');
        const redisPort = configService.get<number>('redis.port') ?? 6379;
        const redisPassword = configService.get<string>('redis.password');
        const redisUrl = configService.get<string>('redis.url');

        try {
          if (redisUrl) {
            return {
              store: await redisStore({
                url: redisUrl,
                password: redisPassword,
              }),
              ttl,
            };
          }

          if (redisHost) {
            return {
              store: await redisStore({
                socket: {
                  host: redisHost,
                  port: redisPort,
                },
                password: redisPassword,
              }),
              ttl,
            };
          }
        } catch (error) {
          logger.warn(
            `Redis cache unavailable, falling back to in-memory store. Reason: ${(error as Error).message}`,
          );
        }

        return { ttl };
      },
    }),
  ],
  providers: [RedisService],
  exports: [CacheModule, RedisService],
})
export class RedisModule {}
