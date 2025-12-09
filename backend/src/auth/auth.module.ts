import { Module } from '@nestjs/common';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { OtpService } from './otp/otp.service';
import { RedisModule } from '../infrastructure/cache/redis.module';
import { SmsModule } from '../infrastructure/sms/sms.module';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { IAdminUserRepository } from '../admin/repositories/admin-user.repository';
import { PrismaAdminUserRepository } from '../admin/repositories/prisma-admin-user.repository';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
    SmsModule,
    UsersModule,
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET') ?? 'dev-secret';
        const expiresIn =
          configService.get<number>('JWT_EXPIRES_IN') ??
          configService.get<string>('JWT_EXPIRES_IN') ??
          '1d';

        const signOptions: JwtSignOptions = {
          expiresIn: expiresIn as JwtSignOptions['expiresIn'],
        };

        return {
          secret,
          signOptions,
        };
      },
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    OtpService,
    {
      provide: IAdminUserRepository,
      useClass: PrismaAdminUserRepository,
    },
  ],
  controllers: [AuthController],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
