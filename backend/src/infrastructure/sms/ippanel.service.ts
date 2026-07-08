import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface IppanelSendResult {
  success: boolean;
  statusCode?: number;
  statusMessage?: string;
  bulkId?: string;
  messageIds?: string[];
  raw?: any;
  requestUrl?: string;
  usedPatternCode?: string;
}

@Injectable()
export class IppanelService {
  private readonly logger = new Logger(IppanelService.name);
  private readonly httpClient: AxiosInstance;
  private readonly apiKey: string;
  private readonly sourceNumber: string;
  private readonly defaultPatternCode: string;
  private readonly baseUrl: string;
  private readonly authScheme: 'Bearer' | 'AccessKey';

  constructor(private readonly configService: ConfigService) {
    const baseUrl = this.configService.get<string>('IPPANEL_BASE_URL') || 'https://edge.ippanel.com/v1';
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.apiKey = this.configService.get<string>('IPPANEL_API_KEY') || '';
    this.sourceNumber = this.configService.get<string>('IPPANEL_FROM_NUMBER') || '';
    this.defaultPatternCode = this.configService.get<string>('IPPANEL_OTP_PATTERN_CODE') || '2tc60';

    const configuredAuthScheme = this.configService.get<string>('IPPANEL_AUTH_SCHEME');
    const host = new URL(this.baseUrl).hostname;
    this.authScheme = configuredAuthScheme === 'Bearer' || host.includes('panelchi')
      ? 'Bearer'
      : 'AccessKey';

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        Authorization: `${this.authScheme} ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Sends a pattern-based SMS to a single recipient (v1/sms/pattern)
   */
  async sendPatternSms(
    to: string,
    patternSlug: string,
    variables: Record<string, string | number>,
  ): Promise<IppanelSendResult> {
    if (!this.apiKey) {
      this.logger.warn('IPPanel API key is not configured; skipping SMS.');
      return { success: false, statusMessage: 'API Key missing' };
    }

    const resolvedPatternSlug = patternSlug && patternSlug !== 'DEFAULT'
      ? patternSlug
      : this.defaultPatternCode;

    if (!resolvedPatternSlug) {
      this.logger.warn('IPPanel pattern code is not configured; skipping SMS.');
      return { success: false, statusMessage: 'Pattern code missing' };
    }

    const recipient = this.formatRecipient(to);
    const sourceNumber = this.sourceNumber;
    if (!sourceNumber) {
      this.logger.warn('IPPanel source number is not configured; skipping pattern SMS.');
      return { success: false, statusMessage: 'Source number missing' };
    }

    const payload = {
      variables,
      recipient,
      sourceNumber,
    };

    const patternCandidates = this.getPatternCandidates(resolvedPatternSlug);
    let lastError: any;

    for (const patternCode of patternCandidates) {
      try {
        const response = await this.postWithFallbacks(['/sms/pattern', '/v1/sms/pattern'], {
          ...payload,
          pattern: patternCode,
        });
        const resData = response.data?.data;

        return {
          success: true,
          bulkId: resData?.uid,
          messageIds: resData?.recipients?.map((r: any) => r.uid) || [],
          raw: response.data,
          requestUrl: response.config.url,
          usedPatternCode: patternCode,
        };
      } catch (error: any) {
        lastError = error;
        if (!this.isPatternUnavailableError(error)) {
          this.handleError('Pattern SMS', error);
          return {
            success: false,
            statusCode: error.response?.status,
            statusMessage: error.response?.data?.detail || error.message,
            requestUrl: error.config?.url,
          };
        }

        this.logger.log(
          `IPPanel pattern '${patternCode}' was rejected; trying the next known pattern code.`,
        );
      }
    }

    const detail = lastError?.response?.data?.detail || lastError?.message;
    this.logger.warn(
      `IPPanel pattern SMS failed for all candidates [${patternCandidates.join(', ')}]: ${detail}`,
    );

    const fallbackMessage = this.buildFallbackMessage(variables);
    const fallbackResult = await this.sendTextSms(to, fallbackMessage);

    if (fallbackResult.success) {
      this.logger.log('IPPanel pattern SMS was unavailable; used plain text SMS fallback.');
      return {
        success: true,
        bulkId: fallbackResult.bulkId,
        messageIds: fallbackResult.messageIds,
        raw: fallbackResult.raw,
        requestUrl: fallbackResult.requestUrl,
        usedPatternCode: resolvedPatternSlug,
        statusMessage: 'Pattern SMS unavailable; used plain text SMS fallback.',
      };
    }

    return {
      success: false,
      statusCode: fallbackResult.statusCode,
      statusMessage: fallbackResult.statusMessage || detail,
      requestUrl: fallbackResult.requestUrl,
    };
  }

  private getPatternCandidates(patternSlug: string): string[] {
    const candidates = [patternSlug, 'hijid9771y36ega', '2tc60', 'kc0p2']
      .filter((value): value is string => Boolean(value && value !== 'DEFAULT'));

    return [...new Set(candidates)];
  }

  private buildFallbackMessage(variables: Record<string, string | number>): string {
    const code = variables.code ?? variables.otp ?? variables.Code;
    if (code !== undefined) {
      return `Your verification code is ${code}`;
    }

    const event = variables.event;
    const eventLink = variables.eventLink;
    if (event !== undefined) {
      const suffix = eventLink ? ` More details: ${eventLink}` : '';
      return `Your registration for ${event} is confirmed.${suffix}`;
    }

    return 'Your message is ready.';
  }

  private isPatternUnavailableError(error: any): boolean {
    const status = error?.response?.status;
    const detail = error?.response?.data?.detail || error?.message || '';
    return status === 404 || status === 422 || /pattern|پترن/i.test(String(detail));
  }

  /**
   * Sends a plain text SMS to one or more recipients (v1/sms/send)
   */
  async sendTextSms(to: string | string[], message: string): Promise<IppanelSendResult> {
    if (!this.apiKey) {
      this.logger.warn('IPPanel API key is not configured; skipping SMS.');
      return { success: false, statusMessage: 'API Key missing' };
    }

    const recipients = (Array.isArray(to) ? to : [to]).map(r => this.formatRecipient(r));
    const payload = {
      message: message.trim(),
      recipients,
      sourceNumber: this.sourceNumber,
    };

    try {
      const response = await this.postWithFallbacks(['/sms/send', '/v1/sms/send'], payload);
      const resData = response.data?.data;

      return {
        success: true,
        bulkId: resData?.uid,
        messageIds: resData?.recipients?.map((r: any) => r.uid) || [],
        raw: response.data,
        requestUrl: response.config.url,
      };
    } catch (error: any) {
      this.handleError('Text SMS', error);
      return {
        success: false,
        statusCode: error.response?.status,
        statusMessage: error.response?.data?.detail || error.message,
        requestUrl: error.config?.url,
      };
    }
  }

  private async postWithFallbacks(paths: string[], payload: Record<string, unknown>) {
    const errors: any[] = [];

    for (const path of paths) {
      try {
        return await this.httpClient.post(path, payload);
      } catch (error: any) {
        errors.push(error);
        const status = error.response?.status;
        if (status !== 404) {
          throw error;
        }
      }
    }

    throw errors[errors.length - 1];
  }

  private formatRecipient(raw: string): string {
    const trimmed = raw?.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('+')) return trimmed;
    if (trimmed.startsWith('00')) return `+${trimmed.slice(2)}`;
    if (trimmed.startsWith('0') && trimmed.length === 11) return `+98${trimmed.slice(1)}`;
    return trimmed;
  }

  private handleError(action: string, error: any) {
    const detail = error.response?.data?.detail || error.message;
    const code = error.response?.data?.code;
    this.logger.error(`IPPanel ${action} failed: ${detail} (Code: ${code})`);
  }
}
