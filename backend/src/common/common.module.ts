import { Global, Module } from '@nestjs/common';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { TransformInterceptor } from './interceptors/transform.interceptor';

const providers = [
  JwtAuthGuard,
  RolesGuard,
  LoggingInterceptor,
  TransformInterceptor,
  HttpExceptionFilter,
];

@Global()
@Module({
  providers,
  exports: providers,
})
export class CommonModule {}
