import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { InternalServerErrorException } from '@nestjs/common';

export interface ZarinpalRequestPaymentParams {
  amount: number;
  description: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ZarinpalService {
  private readonly logger = new Logger(ZarinpalService.name);
  private readonly httpClient: AxiosInstance;
  private readonly merchantId: string;
  private readonly sandbox: boolean;
  private readonly defaultCallbackUrl?: string;

  constructor(private readonly configService: ConfigService) {
    this.merchantId =
      this.configService.get<string>('ZARINPAL_MERCHANT_ID') ?? '';
    this.sandbox =
      (this.configService.get<string>('ZARINPAL_SANDBOX') ?? 'true') === 'true';
    this.defaultCallbackUrl = this.configService.get<string>(
      'ZARINPAL_CALLBACK_URL',
    );

    const baseURL = this.sandbox
      ? 'https://sandbox.zarinpal.com/pg/v4'
      : 'https://api.zarinpal.com/pg/v4';

    this.httpClient = axios.create({
      baseURL,
      timeout: 15_000,
    });
  }

  async requestPayment(params: ZarinpalRequestPaymentParams): Promise<void> {
    const callback_url = params.callbackUrl ?? this.defaultCallbackUrl;
    if (!this.merchantId) {
      throw new InternalServerErrorException(
        'Zarinpal merchantId is not configured',
      );
    }
    if (!callback_url) {
      throw new InternalServerErrorException(
        'Zarinpal callback URL is not configured',
      );
    }

    try {
      // Placeholder for actual API call
      this.logger.debug(
        `Zarinpal requestPayment: amount=${params.amount}, callback=${callback_url}`,
      );
      // await this.httpClient.post('/payment/request.json', { ...payload });
    } catch (error) {
      this.logger.error('Zarinpal requestPayment failed', error);
      throw new InternalServerErrorException('Payment provider unavailable');
    }
  }

  async verifyPayment(amount: number, authority: string): Promise<void> {
    if (!this.merchantId) {
      throw new InternalServerErrorException(
        'Zarinpal merchantId is not configured',
      );
    }

    try {
      // Placeholder for actual API call
      this.logger.debug(
        `Zarinpal verifyPayment: amount=${amount}, authority=${authority}`,
      );
      // await this.httpClient.post('/payment/verify.json', { ...payload });
    } catch (error) {
      this.logger.error('Zarinpal verifyPayment failed', error);
      throw new InternalServerErrorException('Payment provider unavailable');
    }
  }
}
