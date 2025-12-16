import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ContactMessage, ContactMessageStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { MailerService } from '../infrastructure/mailer/mailer.service';
import { ConfigService } from '@nestjs/config';
import { ThrottlerException, ThrottlerStorageService } from '@nestjs/throttler';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { ListContactMessagesQueryDto } from './dto/list-contact-messages.dto';
import { UpdateContactStatusDto } from './dto/update-contact-status.dto';
import {
  ContactMessageDto,
  PaginatedContactMessagesDto,
} from './dto/contact-message.dto';

interface SubmissionMeta {
  ip: string;
  userAgent?: string;
  language: string;
  honeypotValue?: string;
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
    private readonly configService: ConfigService,
    private readonly throttlerStorage: ThrottlerStorageService,
  ) {}

  private getRateLimitCount(): number {
    return Number(this.configService.get('CONTACT_RATE_LIMIT_COUNT') ?? 1);
  }

  private getRateLimitWindow(): number {
    return Number(this.configService.get('CONTACT_RATE_LIMIT_WINDOW') ?? 60);
  }

  private normalizeLanguage(language?: string): string {
    const normalized = (language ?? 'en').toLowerCase();
    return normalized.startsWith('fa') ? 'fa' : 'en';
  }

  private sanitizeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private async enforceRateLimit(ip: string): Promise<void> {
    const limit = this.getRateLimitCount();
    const ttl = this.getRateLimitWindow();
    const key = `contact:${ip}`;
    const record = await this.throttlerStorage.increment(
      key,
      ttl,
      limit,
      0,
      'contact',
    );
    if (record.totalHits > limit) {
      throw new ThrottlerException(
        'Too many requests. Please wait before sending another message.',
      );
    }
  }

  async submitPublicMessage(
    dto: CreateContactMessageDto,
    meta: SubmissionMeta,
  ): Promise<void> {
    await this.enforceRateLimit(meta.ip);

    const honeypotValue = dto.honeypot || dto.website || meta.honeypotValue;
    if (honeypotValue && honeypotValue.trim().length > 0) {
      this.logger.warn(
        `Honeypot triggered for IP ${meta.ip}. Message dropped.`,
      );
      return;
    }

    const language = this.normalizeLanguage(dto.language ?? meta.language);
    const created = await this.prisma.contactMessage.create({
      data: {
        name: dto.name?.trim() || null,
        email: dto.email.toLowerCase(),
        message: dto.message.trim(),
        source: 'public-web',
        ipAddress: meta.ip,
        userAgent: meta.userAgent?.slice(0, 255) ?? null,
        language,
        status: ContactMessageStatus.NEW,
      },
    });

    void this.dispatchNotification(created).catch((error) =>
      this.logger.error(
        'Unable to send contact notification',
        error instanceof Error ? error.message : error,
      ),
    );
  }

  private async dispatchNotification(contact: ContactMessage): Promise<void> {
    if (!this.mailer.configured()) {
      return;
    }

    const subject = `New contact message from ${contact.email}`;
    const plainBody =
      `A new contact message has been received.\n\n` +
      `Name: ${contact.name ?? 'N/A'}\n` +
      `Email: ${contact.email}\n` +
      `Language: ${contact.language}\n` +
      `Source: ${contact.source}\n` +
      `Message:\n${contact.message}`;
    const htmlBody = `
      <p>A new contact message has been received.</p>
      <p><strong>Name:</strong> ${this.sanitizeHtml(contact.name ?? 'N/A')}<br/>
      <strong>Email:</strong> ${this.sanitizeHtml(contact.email)}<br/>
      <strong>Language:</strong> ${this.sanitizeHtml(contact.language)}<br/>
      <strong>Source:</strong> ${this.sanitizeHtml(contact.source)}</p>
      <p><strong>Message:</strong><br/>${this.sanitizeHtml(contact.message).replace(/\n/g, '<br/>')}</p>
    `;

    const sent = await this.mailer.sendMail({
      to: 'thinkthentalk@gmail.com',
      subject,
      text: plainBody,
      html: htmlBody,
      replyTo: contact.email,
    });

    if (sent) {
      await this.prisma.contactMessage.update({
        where: { id: contact.id },
        data: { emailSent: true },
      });
    }
  }

  private buildWhereClause(
    query: ListContactMessagesQueryDto,
  ): Prisma.ContactMessageWhereInput {
    const where: Prisma.ContactMessageWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        const start = new Date(query.startDate);
        if (!isNaN(start.getTime())) {
          where.createdAt.gte = start;
        }
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        if (!isNaN(end.getTime())) {
          where.createdAt.lte = end;
        }
      }
    }

    if (query.search) {
      const search = query.search.trim();
      if (search.length > 0) {
        where.OR = [
          { name: { contains: search } },
          { email: { contains: search } },
          { message: { contains: search } },
        ];
      }
    }

    return where;
  }

  async listMessages(
    query: ListContactMessagesQueryDto,
  ): Promise<PaginatedContactMessagesDto> {
    const where = this.buildWhereClause(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.contactMessage.count({ where }),
    ]);

    return {
      items: items.map((item) => item as ContactMessageDto),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async getMessage(id: string): Promise<ContactMessageDto> {
    const message = await this.prisma.contactMessage.findUniqueOrThrow({
      where: { id },
    });
    return message as ContactMessageDto;
  }

  async updateStatus(
    id: string,
    dto: UpdateContactStatusDto,
  ): Promise<ContactMessageDto> {
    if (dto.status === ContactMessageStatus.NEW) {
      throw new BadRequestException('Invalid status change.');
    }
    const processedAt = new Date();
    const updated = await this.prisma.contactMessage.update({
      where: { id },
      data: { status: dto.status, processedAt },
    });
    return updated as ContactMessageDto;
  }

  async archiveMessage(id: string): Promise<ContactMessageDto> {
    const updated = await this.prisma.contactMessage.update({
      where: { id },
      data: { status: ContactMessageStatus.ARCHIVED, processedAt: new Date() },
    });
    return updated as ContactMessageDto;
  }
}
