import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { TeamMemberDto } from './dto/team-member.dto';
import {
  ReorderTeamMembersDto,
  TeamMemberFormDataDto,
  UpdateTeamMemberFormDataDto,
} from './dto/team-member-form-data.dto';
import { RedisService } from '../infrastructure/cache/redis.service';
import { TeamMember } from '@prisma/client';
import { StorageService } from '../infrastructure/storage/storage.service';
import { FileCategory } from '../infrastructure/storage/storage.types';
import * as path from 'path';

@Injectable()
export class TeamMembersService {
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

  async listPublic(): Promise<TeamMemberDto[]> {
    const cacheKey = 'team:list';
    const cached = await this.redis.getJson<TeamMemberDto[]>(cacheKey);
    if (cached) return cached;
    const members = await this.prisma.teamMember.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    const dtos = members.map(this.toDto);
    await this.redis.setJson(cacheKey, dtos, this.cacheTtl);
    return dtos;
  }

  async listAdmin(): Promise<TeamMemberDto[]> {
    const members = await this.prisma.teamMember.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    return members.map(this.toDto);
  }

  async create(dto: TeamMemberFormDataDto): Promise<TeamMemberDto> {
    const nextOrder = dto.displayOrder ?? (await this.getNextOrder());
    const created = await this.prisma.teamMember.create({
      data: {
        firstNameFa: dto.firstNameFa,
        lastNameFa: dto.lastNameFa,
        roleFa: dto.roleFa,
        firstNameEn: dto.firstNameEn,
        lastNameEn: dto.lastNameEn,
        roleEn: dto.roleEn,
        avatarUrl: dto.avatarUrl || null,
        displayOrder: nextOrder,
        isActive: dto.isActive ?? true,
      },
    });
    await this.redis.del('team:list');
    return this.toDto(created);
  }

  async update(
    id: string,
    dto: UpdateTeamMemberFormDataDto,
  ): Promise<TeamMemberDto | null> {
    const existing = await this.prisma.teamMember.findUnique({ where: { id } });
    if (!existing) return null;

    const updated = await this.prisma.teamMember.update({
      where: { id },
      data: {
        ...(dto.firstNameFa !== undefined
          ? { firstNameFa: dto.firstNameFa }
          : {}),
        ...(dto.lastNameFa !== undefined ? { lastNameFa: dto.lastNameFa } : {}),
        ...(dto.roleFa !== undefined ? { roleFa: dto.roleFa } : {}),
        ...(dto.firstNameEn !== undefined
          ? { firstNameEn: dto.firstNameEn }
          : {}),
        ...(dto.lastNameEn !== undefined ? { lastNameEn: dto.lastNameEn } : {}),
        ...(dto.roleEn !== undefined ? { roleEn: dto.roleEn } : {}),
        ...(dto.avatarUrl !== undefined
          ? { avatarUrl: dto.avatarUrl || null }
          : {}),
        ...(dto.displayOrder !== undefined
          ? { displayOrder: dto.displayOrder }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
    if (dto.avatarUrl !== undefined) {
      const previousMediaPath = this.getTeamMediaPath(existing.avatarUrl);
      const nextMediaPath = this.getTeamMediaPath(updated.avatarUrl);
      if (previousMediaPath && previousMediaPath !== nextMediaPath) {
        try {
          await this.storage.deleteFile(previousMediaPath);
        } catch (error: unknown) {
          console.error('Failed to clean up replaced team member media', {
            teamMemberId: id,
            mediaPath: previousMediaPath,
            error,
          });
        }
      }
    }
    await this.redis.del('team:list');
    return this.toDto(updated);
  }

  async reorder({
    memberId,
    direction,
  }: ReorderTeamMembersDto): Promise<TeamMemberDto[]> {
    const members = await this.prisma.teamMember.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    const currentIndex = members.findIndex((member) => member.id === memberId);
    if (currentIndex === -1) {
      return [];
    }

    const targetIndex =
      direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= members.length) {
      return members.map(this.toDto);
    }

    const reordered = [...members];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    await this.prisma.$transaction(
      reordered.map((member, order) =>
        this.prisma.teamMember.update({
          where: { id: member.id },
          data: { displayOrder: order },
        }),
      ),
    );

    await this.redis.del('team:list');
    const refreshed = await this.prisma.teamMember.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    return refreshed.map(this.toDto);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.prisma.teamMember.findUnique({ where: { id } });
    if (!existing) return false;
    await this.prisma.teamMember.delete({ where: { id } });
    const mediaPath = this.getTeamMediaPath(existing.avatarUrl);
    if (mediaPath) {
      try {
        await this.storage.deleteFile(mediaPath);
      } catch (error: unknown) {
        // The database resource is already gone; leave an actionable log for
        // storage cleanup without turning a successful delete into a false
        // database failure.
        console.error('Failed to clean up deleted team member media', {
          teamMemberId: id,
          mediaPath,
          error,
        });
      }
    }
    await this.redis.del('team:list');
    return true;
  }

  private toDto = (member: TeamMember): TeamMemberDto => ({
    id: member.id,
    firstNameFa: member.firstNameFa,
    lastNameFa: member.lastNameFa,
    roleFa: member.roleFa,
    firstNameEn: member.firstNameEn,
    lastNameEn: member.lastNameEn,
    roleEn: member.roleEn,
    avatarUrl: member.avatarUrl,
    displayOrder: member.displayOrder,
    isActive: member.isActive,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  });

  private async getNextOrder(): Promise<number> {
    const last = await this.prisma.teamMember.findFirst({
      orderBy: [
        { displayOrder: 'desc' },
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
      select: { displayOrder: true },
    });
    return (last?.displayOrder ?? -1) + 1;
  }

  private getTeamMediaPath(value: string | null): string | null {
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
    const relativePath = pathname.slice(prefix.length);
    const parts = relativePath.split('/');
    const filename = parts.slice(1).join('/');
    if (
      parts[0] !== 'team-member' ||
      !filename ||
      filename !== path.posix.basename(filename) ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]{0,254}$/.test(filename)
    ) {
      return null;
    }
    return path.posix.join(FileCategory.TEAM_MEMBER, filename);
  }
}
