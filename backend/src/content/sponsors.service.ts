import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { SponsorDto } from './dto/sponsor.dto';
import {
  SponsorFormDataDto,
  UpdateSponsorFormDataDto,
} from './dto/sponsor-form-data.dto';
import { RedisService } from '../infrastructure/cache/redis.service';
import { Sponsor } from '@prisma/client';
import { StorageService } from '../infrastructure/storage/storage.service';
import { FileCategory } from '../infrastructure/storage/storage.types';
import * as path from 'path';

@Injectable()
export class SponsorsService {
  private readonly cacheTtl: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
    private readonly storage: StorageService,
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
        nameFa: dto.name,
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
        ...(dto.name !== undefined ? { nameFa: dto.name } : {}),
        ...(dto.productOrTagline !== undefined
          ? { productOrTagline: dto.productOrTagline }
          : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
        ...(dto.websiteUrl !== undefined ? { websiteUrl: dto.websiteUrl } : {}),
      },
    });
    if (dto.logoUrl !== undefined) {
      const previousMediaPath = this.getSponsorMediaPath(existing.logoUrl);
      const nextMediaPath = this.getSponsorMediaPath(updated.logoUrl);
      if (previousMediaPath && previousMediaPath !== nextMediaPath) {
        try {
          await this.storage.deleteFile(previousMediaPath);
        } catch (error: unknown) {
          console.error('Failed to clean up replaced sponsor media', {
            sponsorId: id,
            mediaPath: previousMediaPath,
            error,
          });
        }
      }
    }
    await this.redis.del('sponsors:list');
    return this.toDto(updated);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.prisma.sponsor.findUnique({ where: { id } });
    if (!existing) {
      return false;
    }
    await this.prisma.sponsor.delete({ where: { id } });
    const mediaPath = this.getSponsorMediaPath(existing.logoUrl);
    if (mediaPath) {
      try {
        await this.storage.deleteFile(mediaPath);
      } catch (error: unknown) {
        console.error('Failed to clean up deleted sponsor media', {
          sponsorId: id,
          mediaPath,
          error,
        });
      }
    }
    await this.redis.del('sponsors:list');
    return true;
  }

  private toDto = (sponsor: Sponsor): SponsorDto => ({
    id: sponsor.id,
    name: sponsor.nameFa,
    productOrTagline: sponsor.productOrTagline,
    logoUrl: sponsor.logoUrl,
    websiteUrl: sponsor.websiteUrl ?? undefined,
  });

  private getSponsorMediaPath(value: string | null): string | null {
    if (!value) return null;
    let pathname: string;
    try {
      pathname = new URL(value, 'http://uploads.local').pathname;
    } catch {
      return null;
    }
    const prefixes = ['/api/upload/files/', '/uploads/', '/images/'];
    const prefix = prefixes.find((candidate) => pathname.startsWith(candidate));
    if (!prefix) return null;
    const parts = pathname.slice(prefix.length).split('/');
    const filename = parts.slice(1).join('/');
    if (
      parts[0] !== 'sponsor-logo' ||
      !filename ||
      filename !== path.posix.basename(filename) ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]{0,254}$/.test(filename)
    ) {
      return null;
    }
    return path.posix.join(FileCategory.SPONSOR_LOGO, filename);
  }
}
