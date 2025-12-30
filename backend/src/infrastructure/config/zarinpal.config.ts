import { registerAs } from '@nestjs/config';

export interface ZarinpalConfig {
  merchantId: string;
  callbackUrl: string;
  sandbox: boolean;
}

export const zarinpalConfig = registerAs<ZarinpalConfig>('zarinpal', () => ({
  merchantId: process.env.ZARINPAL_MERCHANT_ID ?? '',
  callbackUrl: process.env.ZARINPAL_CALLBACK_URL ?? '',
  sandbox: (process.env.ZARINPAL_SANDBOX ?? 'true') === 'true',
}));
