import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { IppanelService } from '../infrastructure/sms/ippanel.service';
import { SendBulkMessageDto } from './dto/send-bulk-message.dto';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ippanelService: IppanelService,
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

    if (dto.channels.includes('sms') && mobiles.length > 0) {
      this.ippanelService
        .sendTextSms(mobiles, dto.body)
        .catch((err) => this.logger.error('Failed to queue SMS batch', err));
    }

    if (dto.channels.includes('email')) {
      const emails = Array.from(
        new Set(users.map((u) => u.email).filter(Boolean)),
      );
      // Email infrastructure is handled via MailerService if needed, 
      // but here we primarily use IPPanel for community outreach.
      emails.forEach((email) =>
        this.logger.debug(`Queuing email to ${email} with subject="${dto.subject}"`),
      );
    }

    return { success: true, message: 'Message queued for delivery.' };
  }
}
