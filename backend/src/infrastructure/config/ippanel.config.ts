import { registerAs } from '@nestjs/config';

export interface IppanelConfig {
  baseUrl: string;
  patternBaseUrl: string;
  apiKey: string;
  fromNumber: string;
  otpPatternCode: string;
  registerEventPatternCode: string;
}

export const ippanelConfig = registerAs<IppanelConfig>('ippanel', () => {
  const baseUrl = process.env.IPPANEL_BASE_URL ?? 'https://edge.ippanel.com/v1';
  return {
    baseUrl,
    patternBaseUrl: process.env.IPPANEL_PATTERN_BASE_URL ?? baseUrl,
    apiKey: process.env.IPPANEL_API_KEY ?? '',
    fromNumber: process.env.IPPANEL_FROM_NUMBER ?? '',
    otpPatternCode: process.env.IPPANEL_OTP_PATTERN_CODE ?? '2tc60',
    registerEventPatternCode: process.env.IPPANEL_REGISTER_EVENT_PATTERN_CODE ?? 'kc0p2',
  };
});
