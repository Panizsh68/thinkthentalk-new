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

  constructor(private readonly configService: ConfigService) {
    this.merchantId = this.configService.get<string>('ZARINPAL_MERCHANT_ID') ?? '';
    this.callbackUrl =
      this.configService.get<string>('ZARINPAL_CALLBACK_URL') ?? '';
    this.sandbox =
      (this.configService.get<string>('ZARINPAL_SANDBOX') ?? 'true') === 'true';

    const baseURL = this.sandbox
      ? 'https://sandbox.zarinpal.com/pg/v4'
      : 'https://api.zarinpal.com/pg/v4';

    this.http = axios.create({
      baseURL,
      timeout: 15_000,
    });
  }

  async requestPayment(input: RequestPaymentInput): Promise<RequestPaymentResult> {
    if (!this.merchantId || !this.callbackUrl) {
      throw new Error('Zarinpal merchant configuration missing');
    }

    try {
      // Placeholder structure; actual API payload will be added later
      // const response = await this.http.post('/payment/request.json', {...});
      // const { authority, url } = response.data.data;
      // return { authority, url };
      this.logger.debug(
        `Requesting Zarinpal payment for amount=${input.amount}, callback=${this.callbackUrl}`,
      );
      return { authority: 'PLACEHOLDER', url: 'https://example.com' };
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
      // const response = await this.http.post('/payment/verify.json', {...});
      // const { ref_id } = response.data.data;
      // return { success: true, referenceId: String(ref_id) };
      this.logger.debug(
        `Verifying Zarinpal payment for amount=${input.amount}, authority=${input.authority}`,
      );
      return { success: true, referenceId: 'PLACEHOLDER_REF' };
    } catch (error) {
      this.logger.error('Zarinpal verifyPayment failed', error);
      return { success: false };
    }
  }
}
