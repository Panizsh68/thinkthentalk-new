import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { IppanelService } from '../infrastructure/sms/ippanel.service';
import { SendBulkMessageDto } from './dto/send-bulk-message.dto';
import { MailerService } from '../infrastructure/mailer/mailer.service';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ippanelService: IppanelService,
    private readonly mailerService: MailerService,
  ) {}

  status(): { status: 'ok'; module: string; timestamp: string } {
    return {
      status: 'ok',
      module: 'messaging',
      timestamp: new Date().toISOString(),
    };
  }

  async sendBulkMessage(
    dto: SendBulkMessageDto,
  ): Promise<{ success: boolean; message: string }> {
    const registrations = await this.prisma.registration.findMany({
      where: { id: { in: dto.registrationIds } },
      include: { user: true },
    });

    if (!registrations.length) {
      throw new BadRequestException('No registrations found for provided IDs.');
    }

    const users = registrations.map((r) => r.user);
    const mobiles = Array.from(
      new Set(users.map((u) => u.mobile).filter(m => m && !m.includes('@'))),
    );

    let smsSent = 0;
    let emailSent = 0;

    if (dto.channels.includes('sms')) {
      if (mobiles.length === 0) {
        throw new BadRequestException(
          'No valid mobile numbers found for SMS delivery.',
        );
      }

      const smsResult = await this.ippanelService.sendTextSms(mobiles, dto.body);
      if (!smsResult.success) {
        throw new ServiceUnavailableException(
          smsResult.statusMessage || 'SMS delivery failed.',
        );
      }

      smsSent = mobiles.length;
    }

    if (dto.channels.includes('email')) {
      const emails = Array.from(
        new Set(
          users
            .map((u) => u.email)
            .filter((email): email is string => Boolean(email)),
        ),
      );

      if (emails.length === 0) {
        throw new BadRequestException(
          'No valid email addresses found for email delivery.',
        );
      }

      for (const email of emails) {
        const sent = await this.mailerService.sendMail({
          to: email,
          subject: dto.subject || 'Think Then Talk',
          text: dto.body,
        });

        if (sent) {
          emailSent += 1;
        }
      }

      if (emailSent === 0) {
        throw new ServiceUnavailableException('Email delivery failed.');
      }
    }

    return {
      success: true,
      message: `Message delivered. SMS recipients: ${smsSent}. Email recipients: ${emailSent}.`,
    };
  }
}
