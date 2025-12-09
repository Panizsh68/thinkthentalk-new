import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  PaymentGateway,
  RequestPaymentInput,
  RequestPaymentResult,
  VerifyPaymentInput,
  VerifyPaymentResult,
} from './payment-gateway.interface';

@Injectable()
export class ZarinpalGateway implements PaymentGateway {
  private readonly logger = new Logger(ZarinpalGateway.name);
  private readonly http: AxiosInstance;
  private readonly merchantId: string;
  private readonly callbackUrl: string;
  private readonly sandbox: boolean;
  private readonly startPayBase: string;

  constructor(private readonly configService: ConfigService) {
    this.merchantId = this.configService.get<string>('ZARINPAL_MERCHANT_ID') ?? '';
    this.callbackUrl =
      this.configService.get<string>('ZARINPAL_CALLBACK_URL') ?? '';
    this.sandbox =
      (this.configService.get<string>('ZARINPAL_SANDBOX') ?? 'true') === 'true';

    const baseURL = this.sandbox
      ? 'https://sandbox.zarinpal.com/pg/v4'
      : 'https://api.zarinpal.com/pg/v4';

    this.startPayBase = this.sandbox
      ? 'https://sandbox.zarinpal.com/pg/StartPay'
      : 'https://www.zarinpal.com/pg/StartPay';

    this.http = axios.create({
      baseURL,
      timeout: 15_000,
    });
  }

  async requestPayment(input: RequestPaymentInput): Promise<RequestPaymentResult> {
    const callbackUrl = input.callbackUrl || this.callbackUrl;
    if (!this.merchantId || !callbackUrl) {
      throw new Error('Zarinpal merchant configuration missing');
    }

    try {
      const payload: any = {
        merchant_id: this.merchantId,
        amount: Math.round(input.amount),
        description: input.description || 'Event payment',
        callback_url: callbackUrl,
        metadata: input.metadata ?? {},
      };

      if (input.currency) {
        payload.currency = input.currency === 'TOMAN' ? 'IRT' : 'IRR';
      }

      const response = await this.http.post('/payment/request.json', payload);
      const { data, errors } = response.data ?? {};

      if (errors) {
        this.logger.error(`Zarinpal requestPayment error: ${JSON.stringify(errors)}`);
        throw new Error('Payment provider unavailable');
      }

      if (!data || data.code !== 100 || !data.authority) {
        this.logger.error(`Zarinpal requestPayment unexpected response: ${JSON.stringify(data)}`);
        throw new Error('Payment provider unavailable');
      }

      const authority = data.authority as string;
      const url = this.getPaymentUrl(authority);

      this.logger.debug(
        `Requesting Zarinpal payment for amount=${input.amount}, callback=${callbackUrl}, authority=${authority}`,
      );
      return { authority, url };
    } catch (error) {
      this.logger.error('Zarinpal requestPayment failed', error);
      throw new Error('Payment provider unavailable');
    }
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    if (!this.merchantId) {
      throw new Error('Zarinpal merchant configuration missing');
    }

    try {
      const payload = {
        merchant_id: this.merchantId,
        amount: Math.round(input.amount),
        authority: input.authority,
      };

      const response = await this.http.post('/payment/verify.json', payload);
      const { data, errors } = response.data ?? {};

      if (errors) {
        this.logger.error(`Zarinpal verifyPayment error: ${JSON.stringify(errors)}`);
        return { success: false };
      }

      if (data && (data.code === 100 || data.code === 101)) {
        return { success: true, referenceId: String(data.ref_id) };
      }

      this.logger.warn(`Zarinpal verifyPayment failed with code=${data?.code}`);
      this.logger.debug(
        `Verifying Zarinpal payment for amount=${input.amount}, authority=${input.authority}`,
      );
      return { success: false };
    } catch (error) {
      this.logger.error('Zarinpal verifyPayment failed', error);
      return { success: false };
    }
  }

  getPaymentUrl(authority: string): string {
    return `${this.startPayBase}/${authority}`;
  }
}
