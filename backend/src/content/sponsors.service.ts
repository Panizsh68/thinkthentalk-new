import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { SponsorDto } from './dto/sponsor.dto';
import {
  SponsorFormDataDto,
  UpdateSponsorFormDataDto,
} from './dto/sponsor-form-data.dto';
import { RedisService } from '../infrastructure/cache/redis.service';

@Injectable()
export class SponsorsService {
  private readonly cacheTtl: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.cacheTtl = Number(
      this.configService.get('CONTENT_CACHE_TTL_SECONDS') ?? 120,
    );
  }

  async listPublic(): Promise<SponsorDto[]> {
    const cacheKey = 'sponsors:list';
    const cached = await this.redis.getJson<SponsorDto[]>(cacheKey);
    if (cached) return cached;
    const sponsors = await this.prisma.sponsor.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const dtos = sponsors.map(this.toDto);
    await this.redis.setJson(cacheKey, dtos, this.cacheTtl);
    return dtos;
  }

  async listAdmin(): Promise<SponsorDto[]> {
    const sponsors = await this.prisma.sponsor.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return sponsors.map(this.toDto);
  }

  async create(dto: SponsorFormDataDto): Promise<SponsorDto> {
    const sponsor = await this.prisma.sponsor.create({
      data: {
        name: dto.name,
        productOrTagline: dto.productOrTagline,
        logoUrl: dto.logoUrl,
        websiteUrl: dto.websiteUrl,
      },
    });
    await this.redis.del('sponsors:list');
    return this.toDto(sponsor);
  }

  async update(
    id: string,
    dto: UpdateSponsorFormDataDto,
  ): Promise<SponsorDto | null> {
    const existing = await this.prisma.sponsor.findUnique({ where: { id } });
    if (!existing) {
      return null;
    }
    const updated = await this.prisma.sponsor.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.productOrTagline !== undefined
          ? { productOrTagline: dto.productOrTagline }
          : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
        ...(dto.websiteUrl !== undefined ? { websiteUrl: dto.websiteUrl } : {}),
      },
    });
    await this.redis.del('sponsors:list');
    return this.toDto(updated);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.prisma.sponsor.findUnique({ where: { id } });
    if (!existing) {
      return false;
    }
    await this.prisma.sponsor.delete({ where: { id } });
    await this.redis.del('sponsors:list');
    return true;
  }

  private toDto = (sponsor: {
    id: string;
    name: string;
    productOrTagline: string;
    logoUrl: string;
    websiteUrl: string | null;
  }): SponsorDto => ({
    id: sponsor.id,
    name: sponsor.name,
    productOrTagline: sponsor.productOrTagline,
    logoUrl: sponsor.logoUrl,
    websiteUrl: sponsor.websiteUrl ?? undefined,
  });
}
