import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ThrottlerException, ThrottlerStorageService } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { MailerService } from '../infrastructure/mailer/mailer.service';
import { ContactMessageStatus } from '@prisma/client';

describe('ContactService', () => {
  let service: ContactService;
  const prisma = {
    contactMessage: {
      create: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as jest.Mocked<PrismaService>;

  const mailer = {
    configured: jest.fn(() => false),
    sendMail: jest.fn(),
  } as unknown as jest.Mocked<MailerService>;

  const config = {
    get: jest.fn((key: string) => {
      if (key === 'CONTACT_RATE_LIMIT_COUNT') return 1;
      if (key === 'CONTACT_RATE_LIMIT_WINDOW') return 60;
      return undefined;
    }),
  } as unknown as jest.Mocked<ConfigService>;

  const throttler = {
    increment: jest.fn().mockResolvedValue({ totalHits: 1 }),
  } as unknown as jest.Mocked<ThrottlerStorageService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailerService, useValue: mailer },
        { provide: ConfigService, useValue: config },
        { provide: ThrottlerStorageService, useValue: throttler },
      ],
    }).compile();

    service = module.get(ContactService);
  });

  const baseDto = {
    name: 'Jane Tester',
    email: 'jane@example.com',
    message:
      'Hello Think Then Talk!' + ' I have more than ten characters here.',
  };

  const baseMeta = {
    ip: '127.0.0.1',
    userAgent: 'jest',
    language: 'en',
  };

  it('creates a contact message and skips email when SMTP disabled', async () => {
    const createdAt = new Date();
    prisma.contactMessage.create = jest.fn().mockResolvedValue({
      ...baseDto,
      id: 'contact-1',
      source: 'public-web',
      ipAddress: baseMeta.ip,
      userAgent: baseMeta.userAgent,
      language: 'en',
      status: ContactMessageStatus.NEW,
      processedAt: null,
      emailSent: false,
      createdAt,
      updatedAt: createdAt,
    });

    await service.submitPublicMessage(baseDto, baseMeta);

    expect(prisma.contactMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: baseDto.email.toLowerCase(),
          ipAddress: baseMeta.ip,
        }),
      }),
    );
    expect(mailer.configured).toHaveBeenCalled();
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  it('drops honeypot submissions without touching DB', async () => {
    await service.submitPublicMessage(
      { ...baseDto, website: 'filled' },
      baseMeta,
    );
    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
  });

  it('throws when rate limit exceeded', async () => {
    throttler.increment = jest.fn().mockResolvedValue({ totalHits: 5 });
    await expect(
      service.submitPublicMessage(baseDto, baseMeta),
    ).rejects.toBeInstanceOf(ThrottlerException);
  });
});
