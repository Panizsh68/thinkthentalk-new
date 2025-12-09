import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

interface IppanelSendResponse {
  status?: {
    code?: number;
    message?: string;
  };
  data?: {
    bulk_id?: string;
    message_ids?: string[];
  };
  [key: string]: unknown;
}

export interface IppanelSendResult {
  success: boolean;
  statusCode?: number;
  statusMessage?: string;
  bulkId?: string;
  messageIds?: string[];
  raw?: unknown;
}

interface SendPatternOptions {
  from?: string;
  code?: string;
}

interface SendTextOptions {
  from?: string;
}

@Injectable()
export class IppanelService {
  private readonly logger = new Logger(IppanelService.name);
  private readonly httpClient: AxiosInstance;
  private readonly apiKey: string;
  private readonly defaultFrom: string;
  private readonly defaultPatternCode: string;

  constructor(private readonly configService: ConfigService) {
    const baseUrl = this.configService.get<string>('ippanel.baseUrl') ?? 'https://edge.ippanel.com/v1';
    this.apiKey = this.configService.get<string>('ippanel.apiKey') ?? '';
    this.defaultFrom = this.configService.get<string>('ippanel.fromNumber') ?? '';
    this.defaultPatternCode = this.configService.get<string>('ippanel.otpPatternCode') ?? 'otp';
    this.httpClient = axios.create({
      baseURL: baseUrl,
      timeout: 10_000,
    });
  }

  async sendPatternSms(
    to: string | string[],
    params: Record<string, string>,
    options?: SendPatternOptions,
  ): Promise<IppanelSendResult> {
    if (!this.apiKey) {
      this.logger.warn('IPPanel API key is not configured; skipping SMS send.');
      return {
        success: false,
        statusMessage: 'IPPanel API key missing',
      };
    }
    const payload = {
      sending_type: 'pattern',
      from_number: options?.from ?? this.defaultFrom,
      code: options?.code ?? this.defaultPatternCode,
      recipients: this.normalizeRecipients(to),
      params,
    };

    if (!payload.recipients.length) {
      this.logger.warn('Attempted to send IPPanel pattern SMS with no recipients.');
      throw new BadRequestException('At least one recipient is required');
    }

    try {
      const response = await this.executeWithRetry(async () => {
        return this.httpClient.post<IppanelSendResponse>('/api/send', payload, {
          headers: {
            Authorization: this.apiKey,
            'Content-Type': 'application/json',
          },
        });
      }, 'pattern SMS');

      const result = this.mapResponse(response.data);
      this.logger.debug(
        `IPPanel pattern SMS send completed (bulkId=${result.bulkId ?? 'n/a'}, success=${
          result.success
        }, messageIds=${result.messageIds?.join(',') ?? 'n/a'})`,
      );
      return result;
    } catch (error) {
      if (this.isPatternRejection(error)) {
        const rejection = this.mapErrorResponse(error);
        this.logger.warn(
          `IPPanel pattern SMS rejected (status=${rejection.statusCode ?? 'n/a'}, message=${
            rejection.statusMessage ?? 'unknown'
          })`,
        );
        return rejection;
      }
      this.handleProviderError('pattern SMS', error);
    }
  }

  async sendTextSms(
    to: string | string[],
    message: string,
    options?: SendTextOptions,
  ): Promise<IppanelSendResult> {
    if (!this.apiKey) {
      this.logger.warn('IPPanel API key is not configured; skipping SMS send.');
      return {
        success: false,
        statusMessage: 'IPPanel API key missing',
      };
    }
    const recipients = this.normalizeRecipients(to);
    if (!recipients.length) {
      this.logger.warn('Attempted to send IPPanel text SMS with no recipients.');
      throw new BadRequestException('At least one recipient is required');
    }

    try {
      const response = await this.executeWithRetry(async () => {
        return this.httpClient.get<IppanelSendResponse>('/api/send/webservice', {
          params: {
            apikey: this.apiKey,
            from: options?.from ?? this.defaultFrom,
            message,
            to: recipients.join(','),
          },
        });
      }, 'text SMS');

      const result = this.mapResponse(response.data);
      this.logger.debug(
        `IPPanel text SMS send completed (bulkId=${result.bulkId ?? 'n/a'}, success=${
          result.success
        }, messageIds=${result.messageIds?.join(',') ?? 'n/a'})`,
      );
      return result;
    } catch (error) {
      this.handleProviderError('text SMS', error);
    }
  }

  private normalizeRecipients(to: string | string[]): string[] {
    return (Array.isArray(to) ? to : [to])
      .map((recipient) => this.formatRecipient(recipient))
      .filter(Boolean);
  }

  private formatRecipient(raw: string): string {
    const trimmed = raw?.trim();
    if (!trimmed) {
      return '';
    }
    if (trimmed.startsWith('+')) {
      return trimmed;
    }
    if (trimmed.startsWith('00')) {
      return `+${trimmed.slice(2)}`;
    }
    if (trimmed.startsWith('0') && trimmed.length === 11) {
      return `+98${trimmed.slice(1)}`;
    }
    return trimmed;
  }

  private mapResponse(data: IppanelSendResponse): IppanelSendResult {
    const statusCode = data?.status?.code;
    const statusMessage = data?.status?.message ?? (typeof data?.status === 'string' ? data.status : undefined);
    const bulkId = data?.data?.bulk_id ?? (typeof data?.bulk_id === 'string' ? data.bulk_id : undefined);
    const inferredMessageIds =
      data?.data?.message_ids ??
      (Array.isArray((data as any)?.message_ids) ? ((data as any).message_ids as string[]) : undefined) ??
      (Array.isArray((data?.data as any)?.message_outbox_ids)
        ? ((data?.data as any).message_outbox_ids as Array<string | number>).map((id) => String(id))
        : undefined);
    const messageIds = inferredMessageIds;
    const success = typeof statusCode === 'number' ? statusCode < 400 : true;

    return {
      success,
      statusCode,
      statusMessage,
      bulkId,
      messageIds,
      raw: data,
    };
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    action: string,
    attempt = 0,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempt === 0 && this.isRetryableError(error)) {
        this.logger.warn(`IPPanel ${action} failed (attempt ${attempt + 1}); retrying once.`);
        return this.executeWithRetry(operation, action, attempt + 1);
      }
      throw error;
    }
  }

  private isRetryableError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        return true;
      }
      const status = error.response.status;
      return status >= 500;
    }
    return false;
  }

  private isPatternRejection(error: unknown): boolean {
    if (!axios.isAxiosError(error)) {
      return false;
    }
    const status = error.response?.status ?? 0;
    return status >= 400 && status < 500;
  }

  private handleProviderError(action: string, error: unknown): never {
    const reason = axios.isAxiosError(error)
      ? error.message ?? error.response?.statusText ?? 'axios error'
      : error instanceof Error
        ? error.message
        : String(error);
    this.logger.error(`IPPanel ${action} failed`, reason);
    throw new InternalServerErrorException('SMS provider unavailable');
  }

  private mapErrorResponse(error: unknown): IppanelSendResult {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as IppanelSendResponse | undefined;
      return {
        success: false,
        statusCode: error.response?.status,
        statusMessage: this.extractStatusMessage(data),
        raw: data,
      };
    }

    return {
      success: false,
      statusMessage: error instanceof Error ? error.message : String(error),
    };
  }

  private extractStatusMessage(data?: IppanelSendResponse): string | undefined {
    const metaMessage = (data as any)?.meta?.message;
    if (typeof metaMessage === 'string' && metaMessage.trim().length > 0) {
      return metaMessage;
    }
    return data?.status?.message;
  }
}
