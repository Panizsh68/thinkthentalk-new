import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

interface IppanelSendResponse {
  status?: {
    code?: number;
    message?: string;
  };
  meta?: {
    status?: number;
    message?: string;
    [key: string]: unknown;
  };
  data?: {
    bulk_id?: string;
    message_ids?: string[];
    message_id?: string;
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
  private readonly patternClient: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly patternBaseUrl: string;
  private readonly patternUrl: string;
  private readonly textUrl: string;
  private readonly defaultFrom: string;
  private readonly defaultPatternCode: string;

  constructor(private readonly configService: ConfigService) {
    const configuredBaseUrl = this.configService.get<string>('ippanel.baseUrl') ?? 'https://edge.ippanel.com/v1';
    const configuredPatternBaseUrl =
      this.configService.get<string>('ippanel.patternBaseUrl') ?? 'https://api2.ippanel.com';
    this.baseUrl = configuredBaseUrl.replace(/\/+$/, '');
    this.patternBaseUrl = configuredPatternBaseUrl.replace(/\/+$/, '');
    this.apiKey = this.configService.get<string>('ippanel.apiKey') ?? 'YTA4YjNjYmQtZmU2OS00YWUwLWJlYzEtZGIyMzRkNWEyNDViOTFjYjk0NjE4YTI0YjkxZjg0N2M5ZDliYjMzNzZiZDI=';
    this.defaultFrom = this.configService.get<string>('ippanel.fromNumber') ?? '+983000505';
    this.defaultPatternCode = this.configService.get<string>('ippanel.otpPatternCode') ?? 'hijid9771y36ega';
    this.patternUrl = `${this.patternBaseUrl}/api/send`;
    this.textUrl = `${this.baseUrl}/api/send/webservice`;
    this.httpClient = axios.create({ baseURL: this.baseUrl, timeout: 10_000 });
    this.patternClient = axios.create({ baseURL: this.patternBaseUrl, timeout: 10_000 });
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
    const recipients = this.normalizeRecipients(to);
    const recipient = recipients[0];
    if (!recipient) {
      this.logger.warn('Attempted to send IPPanel pattern SMS with no recipients.');
      throw new BadRequestException('At least one recipient is required');
    }
    if (recipients.length > 1) {
      this.logger.warn(`Pattern SMS received ${recipients.length} recipients; using only the first.`);
    }

    const payload = {
      sending_type: 'pattern',
      from_number: options?.from ?? this.defaultFrom,
      code: options?.code ?? this.defaultPatternCode,
      recipients: [recipient],
      params,
    };

    try {
      const response = await this.executeWithRetry(async () => {
        return this.patternClient.post<IppanelSendResponse>(this.patternUrl, payload, {
          headers: this.buildPatternHeaders(),
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
        return this.httpClient.get<IppanelSendResponse>(this.textUrl, {
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
    const meta: any = (data as any)?.meta ?? {};
    const statusCode =
      data?.status?.code ??
      (typeof meta?.status === 'number' ? (meta.status as number) : undefined);
    const statusMessage =
      data?.status?.message ??
      (typeof data?.status === 'string' ? data.status : undefined) ??
      (typeof meta?.message === 'string' ? (meta.message as string) : undefined);
    const bulkId = data?.data?.bulk_id ?? (typeof data?.bulk_id === 'string' ? data.bulk_id : undefined);
    const inferredMessageIds =
      data?.data?.message_ids ??
      (Array.isArray((data as any)?.message_ids) ? ((data as any).message_ids as string[]) : undefined) ??
      (typeof data?.data?.message_id === 'string' ? [data.data.message_id] : undefined) ??
      (typeof (data as any)?.message_id === 'string' ? ([(data as any).message_id] as string[]) : undefined) ??
      (Array.isArray((data?.data as any)?.message_outbox_ids)
        ? ((data?.data as any).message_outbox_ids as Array<string | number>).map((id) => String(id))
        : undefined);
    const messageIds = inferredMessageIds;
    const metaStatus = typeof meta?.status === 'boolean' ? (meta.status as boolean) : undefined;
    const success =
      metaStatus === true ||
      (typeof statusCode === 'number' ? statusCode < 400 : false) ||
      messageIds !== undefined;

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
        statusMessage: this.extractStatusMessage(data) ?? error.response?.statusText,
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

  private buildAuthHeaders(): Record<string, string> {
    return {
      Authorization: `AccessKey ${this.apiKey}`,
      apikey: this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  private buildPatternHeaders(): Record<string, string> {
    return {
      Authorization: this.apiKey,
      apikey: this.apiKey,
      'Content-Type': 'application/json',
    };
  }
}
