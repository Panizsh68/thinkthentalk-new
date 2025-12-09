import { registerAs } from '@nestjs/config';

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export const jwtConfig = registerAs<JwtConfig>('jwt', () => ({
  secret: process.env.JWT_SECRET ?? 'dev-secret',
  expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
}));
