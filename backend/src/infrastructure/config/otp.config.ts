import { registerAs } from '@nestjs/config';

export interface OtpConfig {
  expirationSeconds: number;
  rateLimitPerIp: number;
  rateLimitPerMobile: number;
}

export const otpConfig = registerAs<OtpConfig>('otp', () => ({
  expirationSeconds: Number(process.env.OTP_EXPIRATION_SECONDS ?? 300),
  rateLimitPerIp: Number(process.env.OTP_RATE_LIMIT_PER_IP ?? 10),
  rateLimitPerMobile: Number(process.env.OTP_RATE_LIMIT_PER_MOBILE ?? 5),
}));
