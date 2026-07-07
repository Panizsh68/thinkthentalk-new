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

  constructor(private readonly configService: ConfigService) {
    const baseUrl = this.configService.get<string>('IPPANEL_BASE_URL') || 'https://edge.ippanel.com/v1';
    this.apiKey = this.configService.get<string>('IPPANEL_API_KEY') || '';
    this.sourceNumber = this.configService.get<string>('IPPANEL_FROM_NUMBER') || '';

    this.httpClient = axios.create({
      baseURL: baseUrl.replace(/\/+$/, ''),
      timeout: 15000,
      headers: {
        'Authorization': `AccessKey ${this.apiKey}`,
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

    const recipient = this.formatRecipient(to);
    const payload = {
      pattern: patternSlug,
      variables,
      recipient,
    };

    try {
      const response = await this.httpClient.post('/sms/pattern', payload);
      const resData = response.data?.data;
      
      return {
        success: true,
        bulkId: resData?.uid,
        messageIds: resData?.recipients?.map((r: any) => r.uid) || [],
        raw: response.data,
        requestUrl: response.config.url,
        usedPatternCode: patternSlug,
      };
    } catch (error: any) {
      this.handleError('Pattern SMS', error);
      return {
        success: false,
        statusCode: error.response?.status,
        statusMessage: error.response?.data?.detail || error.message,
        requestUrl: error.config?.url,
      };
    }
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
      const response = await this.httpClient.post('/sms/send', payload);
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
