import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  PaymentGateway,
  RequestPaymentInput,
  RequestPaymentResult,
  VerifyPaymentInput,
  VerifyPaymentResult,
} from './payment-gateway.interface';
import ZarinPal from 'zarinpal-node-sdk';

@Injectable()
export class ZarinpalGateway implements PaymentGateway {
  private readonly logger = new Logger(ZarinpalGateway.name);
  private readonly merchantId: string;
  private readonly callbackUrl: string;
  private readonly sandbox: boolean;
  private readonly startPayBase: string;
  private readonly client: ZarinPal;

  constructor(private readonly configService: ConfigService) {
    this.merchantId = this.configService.get<string>('ZARINPAL_MERCHANT_ID') ?? 'f1911c5f-deee-4c21-ae20-06a00877fd3d';
    this.callbackUrl =
      this.configService.get<string>('ZARINPAL_CALLBACK_URL') ?? 'https://thinkthentalk.ir/api/payments/callback';
    this.sandbox =
      (this.configService.get<string>('ZARINPAL_SANDBOX') ?? 'true') === 'true';

    this.startPayBase = this.sandbox
      ? 'https://sandbox.zarinpal.com/pg/StartPay'
      : 'https://www.zarinpal.com/pg/StartPay';

    this.client = new ZarinPal({
      merchantId: this.merchantId,
      sandbox: this.sandbox,
    });
  }

  async requestPayment(input: RequestPaymentInput): Promise<RequestPaymentResult> {
    const callbackUrl = input.callbackUrl || this.callbackUrl;
    if (!this.merchantId || !callbackUrl) {
      throw new Error('Zarinpal merchant configuration missing');
    }

    try {
      const amountRounded = Math.round(input.amount);
      const mobile =
        typeof input.metadata?.mobile === 'string' ? input.metadata?.mobile : undefined;
      const email =
        typeof input.metadata?.email === 'string' ? input.metadata?.email : undefined;
      const response = await this.client.payments.create({
        amount: amountRounded,
        description: input.description || 'Event payment',
        callback_url: callbackUrl,
        mobile,
        email,
        ...(input.currency ? { currency: input.currency === 'TOMAN' ? 'IRT' : 'IRR' } : {}),
      });

      const authority = response.data?.authority as string | undefined;
      const code = response.data?.code;

      if (!authority || (code !== 100 && code !== 101)) {
        this.logger.error(
          `Zarinpal requestPayment unexpected response: ${JSON.stringify(response.data)}`,
        );
        throw new Error('Payment provider unavailable');
      }

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
      const amountRounded = Math.round(input.amount);
      const response = await this.client.verifications.verify({
        amount: amountRounded,
        authority: input.authority,
      });

      const data = response.data;

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
