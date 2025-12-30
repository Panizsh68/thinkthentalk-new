import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ValidationError as ClassValidatorError } from 'class-validator';
import {
  DomainError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../errors/domain.errors';

interface ErrorResponse {
  message: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const { status, body } = this.mapException(exception);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} failed with status ${status}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} failed with status ${status}: ${body.message}`,
      );
    }

    response.status(status).json(body);
  }

  private mapException(exception: unknown): {
    status: number;
    body: ErrorResponse;
  } {
    if (
      Array.isArray(exception) &&
      exception.every((e) => e instanceof ClassValidatorError)
    ) {
      const messages = exception
        .map((err) => Object.values(err.constraints ?? {}).join(', '))
        .filter(Boolean);
      return {
        status: HttpStatus.BAD_REQUEST,
        body: { message: messages.join('; ') || 'Validation failed' },
      };
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : typeof response === 'object' &&
              response !== null &&
              'message' in response
            ? (response as { message: string | string[] }).message
            : exception.message;

      return {
        status: exception.getStatus(),
        body: {
          message: Array.isArray(message) ? message.join(', ') : message,
        },
      };
    }

    if (exception instanceof DomainError) {
      return {
        status: exception.statusCode,
        body: { message: exception.message },
      };
    }

    if (exception instanceof ValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        body: { message: exception.message },
      };
    }

    if (exception instanceof ForbiddenError) {
      return {
        status: HttpStatus.FORBIDDEN,
        body: { message: exception.message },
      };
    }

    if (exception instanceof NotFoundError) {
      return {
        status: HttpStatus.NOT_FOUND,
        body: { message: exception.message },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { message: 'Internal server error' },
    };
  }
}
