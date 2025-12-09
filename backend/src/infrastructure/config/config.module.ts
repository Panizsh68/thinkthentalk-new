import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { appConfig } from './app.config';
import { databaseConfig } from './database.config';
import { jwtConfig } from './jwt.config';
import { otpConfig } from './otp.config';
import { redisConfig } from './redis.config';
import { zarinpalConfig } from './zarinpal.config';
import { ippanelConfig } from './ippanel.config';

const nodeEnv = process.env.NODE_ENV ?? 'development';
const envFilePath = [`.env.${nodeEnv}`, '.env'];

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        jwtConfig,
        otpConfig,
        zarinpalConfig,
        ippanelConfig,
      ],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().port().default(3000),
        DB_HOST: Joi.string().hostname().default('localhost'),
        DB_PORT: Joi.number().port().default(3306),
        DB_USER: Joi.string().default('root'),
        DB_PASSWORD: Joi.string().allow('').default(''),
        DB_NAME: Joi.string().default('think_then_talk'),
        REDIS_HOST: Joi.string().hostname().optional(),
        REDIS_PORT: Joi.number().port().optional(),
        REDIS_PASSWORD: Joi.string().optional(),
        JWT_SECRET: Joi.string()
          .when('NODE_ENV', {
            is: 'production',
            then: Joi.required(),
          })
          .default('dev-secret'),
        JWT_EXPIRES_IN: Joi.string().default('1d'),
        OTP_EXPIRATION_SECONDS: Joi.number().positive().default(300),
        OTP_RATE_LIMIT_PER_IP: Joi.number().positive().default(10),
        OTP_RATE_LIMIT_PER_MOBILE: Joi.number().positive().default(5),
        CONTACT_RATE_LIMIT_WINDOW: Joi.number().positive().default(60),
        CONTACT_RATE_LIMIT_COUNT: Joi.number().positive().default(1),
        ZARINPAL_MERCHANT_ID: Joi.string().when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.allow(''),
        }),
        ZARINPAL_CALLBACK_URL: Joi.string()
          .uri()
          .when('NODE_ENV', {
            is: 'production',
            then: Joi.required(),
            otherwise: Joi.allow(''),
          }),
        ZARINPAL_SANDBOX: Joi.boolean().default(true),
        IPPANEL_BASE_URL: Joi.string().uri().default('https://edge.ippanel.com/v1'),
        IPPANEL_PATTERN_BASE_URL: Joi.string().uri().default('https://api2.ippanel.com').optional(),
        IPPANEL_API_KEY: Joi.string().when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.allow(''),
        }),
        IPPANEL_FROM_NUMBER: Joi.string().when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.allow(''),
        }),
        IPPANEL_OTP_PATTERN_CODE: Joi.string().default('otp'),
        SMTP_HOST: Joi.string().allow(''),
        SMTP_PORT: Joi.number().port().default(587),
        SMTP_USER: Joi.string().allow(''),
        SMTP_PASS: Joi.string().allow(''),
        SMTP_FROM: Joi.string().default('no-reply@thinkthentalk.ir'),
      }).options({
        presence: nodeEnv === 'production' ? 'required' : 'optional',
        abortEarly: false,
      }),
    }),
  ],
  exports: [ConfigModule],
})
export class InfrastructureConfigModule {}
