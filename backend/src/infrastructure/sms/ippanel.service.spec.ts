/// <reference types="jest" />

import { ConfigService } from '@nestjs/config';
import { IppanelService } from './ippanel.service';

describe('IppanelService', () => {
  let service: IppanelService;
  let configService: Pick<ConfigService, 'get'>;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          IPPANEL_BASE_URL: 'https://api.panelchi.com',
          IPPANEL_API_KEY: 'test-token',
          IPPANEL_FROM_NUMBER: '10001',
          IPPANEL_OTP_PATTERN_CODE: 'verify-otp',
          IPPANEL_AUTH_SCHEME: 'Bearer',
        };
        return values[key];
      }),
    };

    service = new IppanelService(configService as ConfigService);
  });

  it('normalizes a legacy registration pattern alias to the Panelchi pattern id', async () => {
    const postWithFallbacksSpy = jest.spyOn(service as any, 'postWithFallbacks')
      .mockResolvedValueOnce({
        data: {
          data: {
            uid: 'bulk-1',
            recipients: [{ uid: 'recipient-1' }],
          },
        },
        config: { url: '/sms/pattern' },
      });

    const sendTextSmsSpy = jest.spyOn(service as any, 'sendTextSms');

    const result = await service.sendPatternSms('+989300000000', 'register-event', {
      event: 'Think Then Talk',
      eventLink: 'https://thinkthentalk.ir/events/example',
    });

    expect(postWithFallbacksSpy).toHaveBeenCalledTimes(1);
    expect(sendTextSmsSpy).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.usedPatternCode).toBe('kc0p2');
  });

  it('does not warn when the normalized pattern code succeeds', async () => {
    const warnSpy = jest.spyOn((service as any).logger, 'warn').mockImplementation(() => undefined);

    jest.spyOn(service as any, 'postWithFallbacks').mockResolvedValueOnce({
        data: {
          data: {
            uid: 'bulk-2',
            recipients: [{ uid: 'recipient-2' }],
          },
        },
        config: { url: '/sms/pattern' },
      });

    const result = await service.sendPatternSms('+989300000000', 'verify-otp', { code: '123456' });

    expect(result.success).toBe(true);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
