import { registerAs } from '@nestjs/config';

export interface IppanelConfig {
  baseUrl: string;
  patternBaseUrl: string;
  apiKey: string;
  fromNumber: string;
  otpPatternCode: string;
}

export const ippanelConfig = registerAs<IppanelConfig>('ippanel', () => ({
  baseUrl: process.env.IPPANEL_BASE_URL ?? 'https://edge.ippanel.com/v1',
  patternBaseUrl:
    process.env.IPPANEL_PATTERN_BASE_URL ??
    process.env.IPPANEL_BASE_URL ??
    'https://edge.ippanel.com/v1',
  apiKey: process.env.IPPANEL_API_KEY ?? '',
  fromNumber: process.env.IPPANEL_FROM_NUMBER ?? '',
  otpPatternCode: process.env.IPPANEL_OTP_PATTERN_CODE ?? 'otp',
}));
