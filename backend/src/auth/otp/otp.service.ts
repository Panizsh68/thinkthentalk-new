import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DomainError, TooManyRequestsError } from '../../common/errors/domain.errors';
import { RedisService } from '../../infrastructure/cache/redis.service';
import { generateOtp } from './otp.generator';
import { OtpContext, OtpResult } from './otp.types';
import { Logger } from '@nestjs/common';

class InvalidOtpError extends DomainError {
  constructor() {
    super('Invalid OTP', 401);
    this.name = 'InvalidOtpError';
  }
}

class ExpiredOtpError extends DomainError {
  constructor() {
    super('Expired OTP', 401);
    this.name = 'ExpiredOtpError';
  }
}

class RateLimitExceededError extends TooManyRequestsError {}

@Injectable()
export class OtpService {
  private readonly ttlSeconds: number;
  private readonly perIpLimit: number;
  private readonly perMobileLimit: number;
  private readonly verifyPerMobileLimit: number;
  private readonly logger = new Logger(OtpService.name);
  private readonly isProd: boolean;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.ttlSeconds = Number(
      this.configService.get<number>('OTP_EXPIRATION_SECONDS') ?? 300,
    );
    this.perIpLimit = Number(
      this.configService.get<number>('OTP_RATE_LIMIT_PER_IP') ?? 10,
    );
    this.perMobileLimit = Number(
      this.configService.get<number>('OTP_RATE_LIMIT_PER_MOBILE') ?? 5,
    );
    this.verifyPerMobileLimit = Number(
      this.configService.get<number>('OTP_VERIFY_RATE_LIMIT_PER_MOBILE') ?? 5,
    );
    this.isProd = (this.configService.get<string>('NODE_ENV') ?? 'development') === 'production';
  }

  async generateAndStoreOtp(
    mobile: string,
    context: OtpContext,
    requesterIp?: string,
  ): Promise<OtpResult> {
    const normalizedMobile = this.normalizeMobile(mobile);
    await this.enforceRateLimits(normalizedMobile, requesterIp);

    const code = generateOtp();
    const key = this.keyForOtp(context, normalizedMobile);

    await this.redisService.setWithTTL(key, code, this.ttlSeconds);
    this.logger.log(`OTP stored key=${key} ttl=${this.ttlSeconds}s`);

    return { code, expiresInSeconds: this.ttlSeconds };
  }

  async verifyOtp(mobile: string, context: OtpContext, otp: string): Promise<void> {
    const normalizedMobile = this.normalizeMobile(mobile);
    await this.incrementAndCheckLimit(this.keyForVerifyCount(normalizedMobile), this.verifyPerMobileLimit);
    const key = this.keyForOtp(context, normalizedMobile);
    const stored = await this.redisService.get<string>(key);

    if (!stored) {
      this.logger.warn(`OTP verify failed: not found key=${key}`);
      if (!this.isProd) {
        this.logger.warn(`No OTP found for ${mobile} (dev mode); accepting for convenience.`);
        return;
      }
      throw new ExpiredOtpError();
    }

    if (stored !== otp) {
      this.logger.warn(`OTP mismatch key=${key} stored=${stored} provided=${otp}`);
      if (!this.isProd) {
        this.logger.warn(`OTP mismatch for ${mobile}. Stored=${stored}, provided=${otp}; rejecting in dev.`);
      }
      throw new InvalidOtpError();
    }

    await this.redisService.del(key);
    this.logger.log(`OTP verified and deleted key=${key}`);
  }

  private async enforceRateLimits(mobile: string, requesterIp?: string): Promise<void> {
    const tasks: Promise<void>[] = [];

    tasks.push(this.incrementAndCheckLimit(this.keyForMobileCount(mobile), this.perMobileLimit));

    if (requesterIp) {
      tasks.push(this.incrementAndCheckLimit(this.keyForIpCount(requesterIp), this.perIpLimit));
    }

    await Promise.all(tasks);
  }

  private async incrementAndCheckLimit(key: string, limit: number): Promise<void> {
    const current = (await this.redisService.get<number>(key)) ?? 0;
    const next = current + 1;

    if (next > limit) {
      throw new RateLimitExceededError();
    }

    const ttl = this.ttlSeconds;
    await this.redisService.setWithTTL(key, next, ttl);
  }

  private keyForOtp(context: OtpContext, mobile: string): string {
    return `otp:${context.toLowerCase()}:${mobile}`;
  }

  private keyForIpCount(ip: string): string {
    return `otp:count:ip:${ip}`;
  }

  private keyForMobileCount(mobile: string): string {
    return `otp:count:mobile:${mobile}`;
  }

  private keyForVerifyCount(mobile: string): string {
    return `otp:verify:mobile:${mobile}`;
  }

  private normalizeMobile(mobile: string): string {
    return (mobile ?? '').replace(/\s+/g, '').trim();
  }
}
