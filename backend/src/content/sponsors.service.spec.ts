import { SponsorsService } from './sponsors.service';

describe('SponsorsService', () => {
  const prisma = {
    sponsor: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const redis = { del: jest.fn() };
  const config = { get: jest.fn().mockReturnValue(120) };
  const storage = { deleteFile: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('persists and returns the sponsor product or tagline', async () => {
    const service = new SponsorsService(
      prisma as never,
      redis as never,
      config as never,
      storage as never,
    );
    const sponsor = {
      id: 'sponsor-1',
      nameFa: 'TTT Sponsor',
      productOrTagline: 'Learning partner',
      logoUrl: '/api/upload/files/sponsor-logo/logo.png',
      websiteUrl: 'https://example.com',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    prisma.sponsor.create.mockResolvedValue(sponsor);

    const result = await service.create({
      name: 'TTT Sponsor',
      productOrTagline: 'Learning partner',
      logoUrl: '/api/upload/files/sponsor-logo/logo.png',
      websiteUrl: 'https://example.com',
    });

    expect(prisma.sponsor.create).toHaveBeenCalledWith({
      data: {
        nameFa: 'TTT Sponsor',
        productOrTagline: 'Learning partner',
        logoUrl: '/api/upload/files/sponsor-logo/logo.png',
        websiteUrl: 'https://example.com',
      },
    });
    expect(result.productOrTagline).toBe('Learning partner');
  });
});
