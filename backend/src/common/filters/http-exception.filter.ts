import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ValidationError as ClassValidatorError } from 'class-validator';
import { DomainError } from '../errors/domain.errors';

interface ErrorResponse {
  message: string;
  error?: string;
  statusCode: number;
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
        `${request.method} ${request.url} failed with status ${status}: ${body.message}`,
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception),
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
      exception.length > 0 &&
      (exception[0] instanceof ClassValidatorError || exception[0]?.constraints)
    ) {
      const messages = exception
        .map((err) => Object.values(err.constraints ?? {}).join(', '))
        .filter(Boolean);
      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          message: messages.join('; ') || 'Validation failed',
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
        },
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
          message: Array.isArray(message)
            ? message.join(', ')
            : message || exception.message || 'Error',
          statusCode: exception.getStatus(),
          error: exception.name,
        },
      };
    }

    if (exception instanceof DomainError) {
      return {
        status: exception.statusCode,
        body: {
          message: exception.message,
          statusCode: exception.statusCode,
          error: exception.name,
        },
      };
    }

    const genericMessage =
      exception instanceof Error ? exception.message : 'Internal server error';

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        message: genericMessage,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: (exception as any)?.name || 'InternalServerError',
      },
    };
  }
}
