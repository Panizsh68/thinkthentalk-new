import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { ModuleStatusDto } from '../common/dto/module-status.dto';
import { IppanelService } from '../infrastructure/sms/ippanel.service';
import { TestOtpQueryDto } from './dto/test-otp-query.dto';

@ApiTags('Messaging')
@Controller({ path: 'messaging', version: '1' })
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly ippanelService: IppanelService,
  ) { }

  @Get('status')
  @ApiOperation({ summary: 'Module status', description: 'Health/status check for the messaging subsystem.' })
  @ApiOkResponse({ description: 'Messaging status.', type: ModuleStatusDto })
  status(): ModuleStatusDto {
    return this.messagingService.status();
  }

  @Get('test-otp')
  @ApiOperation({
    summary: 'Send test OTP via pattern',
    description:
      'Simple GET endpoint to validate IPPanel pattern sending. Provide ?mobile=09xxxxxxxxx and optional otp/patternCode.',
  })
  @ApiOkResponse({
    description: 'Pattern SMS send attempt result.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        otp: { type: 'string' },
        statusCode: { type: 'number', nullable: true },
        statusMessage: { type: 'string', nullable: true },
        bulkId: { type: 'string', nullable: true },
        messageIds: { type: 'array', items: { type: 'string' } },
        patternCode: { type: 'string', nullable: true },
      },
    },
  })
  async sendTestOtp(@Query() query: TestOtpQueryDto): Promise<{
    success: boolean;
    otp: string;
    statusCode?: number;
    statusMessage?: string;
    bulkId?: string;
    messageIds?: string[];
    patternCode?: string;
    endpoint?: string;
  }> {
    const otp = query.otp ?? this.generateOtp();
    const patternCode = query.patternCode;
    const patternOptions = patternCode ? { code: patternCode } : undefined;
    const result = await this.ippanelService.sendPatternSms(query.mobile, { code: otp }, patternOptions);

    return {
      success: result.success,
      otp,
      statusCode: result.statusCode,
      statusMessage: result.statusMessage,
      bulkId: result.bulkId,
      messageIds: result.messageIds ?? [],
      patternCode: result.usedPatternCode ?? patternOptions?.code ?? 'DEFAULT',
      endpoint: result.requestUrl,
    };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
