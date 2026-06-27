import {
  Injectable,
  UnauthorizedException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OtpService } from './otp/otp.service';
import { IppanelService } from '../infrastructure/sms/ippanel.service';
import { IUserRepository } from '../users/repositories/user.repository';
import { toUserDto } from '../users/mappers/user.mapper';
import { IAdminUserRepository } from '../admin/repositories/admin-user.repository';
import { toAdminUserDto } from '../admin/mappers/admin-user.dto.mapper';
import { RedisService } from '../infrastructure/cache/redis.service';
import { ConfigService } from '@nestjs/config';
import { TooManyRequestsError } from '../common/errors/domain.errors';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 10;

  constructor(
    private readonly otpService: OtpService,
    private readonly ippanelService: IppanelService,
    private readonly userRepository: IUserRepository,
    private readonly adminUserRepository: IAdminUserRepository,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  private get adminEmailLimit() {
    return Number(
      this.configService.get<number>('ADMIN_LOGIN_RATE_LIMIT_PER_EMAIL') ?? 5,
    );
  }

  private get adminIpLimit() {
    return Number(
      this.configService.get<number>('ADMIN_LOGIN_RATE_LIMIT_PER_IP') ?? 10,
    );
  }

  private get adminWindowSeconds() {
    return Number(
      this.configService.get<number>('ADMIN_LOGIN_RATE_LIMIT_WINDOW_SECONDS') ??
        600,
    );
  }

  status(): { status: 'ok'; module: string; timestamp: string } {
    return {
      status: 'ok',
      module: 'auth',
      timestamp: new Date().toISOString(),
    };
  }

  async requestOtp(mobile: string, ipAddress: string): Promise<void> {
    const result = await this.otpService.generateAndStoreOtp(
      mobile,
      'LOGIN',
      ipAddress,
    );
    if (
      (this.configService.get<string>('NODE_ENV') ?? 'development') !==
      'production'
    ) {
      this.logger.log(`Dev OTP for ${mobile}: ${result.code}`);
    }
    const patternResult = await this.ippanelService.sendPatternSms(mobile, {
      code: result.code,
    });
    if (!patternResult.success) {
      this.logger.warn(
        `IPPanel pattern send failed (status=${patternResult.statusCode ?? 'n/a'}).`,
      );
    }
  }

  async verifyOtpAndLogin(
    mobile: string,
    otp: string,
  ): Promise<{ token: string; user: ReturnType<typeof toUserDto> }> {
    try {
      await this.otpService.verifyOtp(mobile, 'LOGIN', otp);
    } catch {
      throw new UnauthorizedException('Invalid OTP.');
    }

    let user = await this.userRepository.findByMobile(mobile);
    if (!user) {
      user = await this.userRepository.createOrUpdateFromOtpProfile({ mobile });
    }

    const payload = { sub: user.id, type: 'USER' as const };
    const token = await this.jwtService.signAsync(payload);

    this.logger.log(`Issued user token for ${mobile}`);
    return { token, user: toUserDto(user) };
  }

  async loginWithEmail(
    email: string,
    password: string,
  ): Promise<{ token: string; user: ReturnType<typeof toUserDto> }> {
    const cleanEmail = email.toLowerCase().trim();
    let user = await this.userRepository.findByEmail(cleanEmail);

    if (user) {
      // User exists -> Login
      if (!user.password) {
        throw new UnauthorizedException(
          'This account does not have a password. Please log in with your mobile number.',
        );
      }
      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid) {
        throw new UnauthorizedException('Invalid credentials.');
      }
    } else {
      // User does not exist -> Signup
      const hashedPassword = await bcrypt.hash(password, this.saltRounds);
      try {
        user = await this.userRepository.createUserWithEmailPassword(
          cleanEmail,
          hashedPassword,
        );
      } catch (error) {
        this.logger.error('Error during user creation', error);
        throw new ConflictException('A user with this email might already exist.');
      }
    }

    const payload = { sub: user.id, type: 'USER' as const };
    const token = await this.jwtService.signAsync(payload);

    this.logger.log(`Issued user token for email: ${cleanEmail}`);
    return { token, user: toUserDto(user) };
  }

  async loginAdmin(
    email: string,
    password: string,
    ip?: string,
  ): Promise<{ token: string; user: ReturnType<typeof toAdminUserDto> }> {
    await this.enforceAdminLoginRateLimit(email, ip);

    const admin = await this.adminUserRepository.findByEmail(email);
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const passwordValid = await bcrypt.compare(password, admin.password || '');
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const payload = { sub: admin.id, type: 'ADMIN' as const, role: admin.role };
    const token = await this.jwtService.signAsync(payload);

    this.logger.log(`Issued admin token for ${email}`);
    return { token, user: toAdminUserDto(admin) };
  }

  private async enforceAdminLoginRateLimit(
    email: string,
    ip?: string,
  ): Promise<void> {
    const keys = [`admin:login:email:${email.toLowerCase()}`];
    if (ip) {
      keys.push(`admin:login:ip:${ip}`);
    }

    for (const key of keys) {
      const current = (await this.redisService.get<number>(key)) ?? 0;
      const next = current + 1;
      const limit = key.includes(':ip:')
        ? this.adminIpLimit
        : this.adminEmailLimit;

      if (next > limit) {
        throw new TooManyRequestsError(
          'Too many attempts. Please try again later.',
        );
      }

      await this.redisService.setWithTTL(key, next, this.adminWindowSeconds);
    }
  }
}
