import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;

  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:9002',
    'http://10.88.0.3:9002',
    'https://thinkthentalk.ir',
    'https://www.thinkthentalk.ir',
    /https?:\/\/.*\.cloudworkstations\.dev$/,
  ];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (
        !origin ||
        allowedOrigins.some((o) =>
          typeof o === 'string' ? o === origin : o.test(origin),
        )
      ) {
        callback(null, true);
      } else {
        logger.warn(`CORS: Origin ${origin} not allowed.`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    exposedHeaders: ['Authorization'],
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // Versioning disabled for now - all routes accessible at /api without /v1 prefix
  // TODO: Properly implement URI versioning when upgrading NestJS
  // app.enableVersioning({
  //   type: VersioningType.URI,
  //   defaultVersion: '1',
  // });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Think Then Talk API')
    .setDescription(
      'The complete API specification for the Think Then Talk event platform.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearerAuth',
    )
    .addTag('Auth', 'User and Admin Authentication')
    .addTag('Users', 'User profile management')
    .addTag('Events', 'Public operations for events')
    .addTag('Registrations', 'User-facing registration and payment flow')
    .addTag('Payments', 'Operations related to payment processing')
    .addTag(
      'Discounts',
      'Operations for managing and validating discount codes',
    )
    .addTag(
      'Content Management',
      'Admin operations for managing site content like Sponsors and Team members',
    )
    .addTag(
      'Feedback',
      'Operations for managing event feedback forms and viewing responses',
    )
    .addTag('Messaging', 'Admin tools for bulk messaging')
    .addTag('Admin', 'General admin utilities like statistics and exports')
    .addServer('http://localhost:3000', 'Development server')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    customSiteTitle: 'Think Then Talk API Docs',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.enableShutdownHooks();
  await app.listen(port);
  logger.log(`Application is running at http://localhost:${port}/api`);
  logger.log(`API docs available at http://localhost:${port}/docs`);
}
bootstrap();
