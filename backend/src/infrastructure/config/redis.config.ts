import { registerAs } from '@nestjs/config';

export interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  url?: string;
}

export const redisConfig = registerAs<RedisConfig>('redis', () => {
  const host = process.env.REDIS_HOST;
  const port = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined;
  const password = process.env.REDIS_PASSWORD;
  const url = host
    ? `redis://${password ? `:${password}@` : ''}${host}${port ? `:${port}` : ''}`
    : undefined;

  return {
    host,
    port,
    password,
    url,
  };
});
