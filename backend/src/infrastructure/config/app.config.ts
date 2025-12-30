import { registerAs } from '@nestjs/config';

export interface AppConfig {
  env: string;
  port: number;
}

export const appConfig = registerAs<AppConfig>('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
}));
