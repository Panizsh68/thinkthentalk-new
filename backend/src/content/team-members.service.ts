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

@Injectable()
export class TeamMembersService {
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

  async listPublic(): Promise<TeamMemberDto[]> {
    const cacheKey = 'team:list';
    const cached = await this.redis.getJson<TeamMemberDto[]>(cacheKey);
    if (cached) return cached;
    const members = await this.prisma.teamMember.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    const dtos = members.map(this.toDto);
    await this.redis.setJson(cacheKey, dtos, this.cacheTtl);
    return dtos;
  }

  async listAdmin(): Promise<TeamMemberDto[]> {
    const members = await this.prisma.teamMember.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    return members.map(this.toDto);
  }

  async create(dto: TeamMemberFormDataDto): Promise<TeamMemberDto> {
    const nextOrder = dto.order ?? (await this.getNextOrder());
    const created = await this.prisma.teamMember.create({
      data: {
        firstNameFa: dto.name, // Assuming name maps to firstNameFa for now, or split it
        lastNameFa: '',
        roleFa: dto.role,
        avatarUrl: dto.photoUrl,
        order: nextOrder,
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
        ...(dto.name !== undefined ? { firstNameFa: dto.name } : {}),
        ...(dto.role !== undefined ? { roleFa: dto.role } : {}),
        ...(dto.photoUrl !== undefined ? { avatarUrl: dto.photoUrl } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
      },
    });
    await this.redis.del('team:list');
    return this.toDto(updated);
  }

  async reorder({ memberId, direction }: ReorderTeamMembersDto): Promise<TeamMemberDto[]> {
    const members = await this.prisma.teamMember.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    const currentIndex = members.findIndex((member) => member.id === memberId);
    if (currentIndex === -1) {
      return [];
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
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
          data: { order },
        }),
      ),
    );

    await this.redis.del('team:list');
    const refreshed = await this.prisma.teamMember.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    return refreshed.map(this.toDto);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.prisma.teamMember.findUnique({ where: { id } });
    if (!existing) return false;
    await this.prisma.teamMember.delete({ where: { id } });
    await this.redis.del('team:list');
    return true;
  }

  private toDto = (member: TeamMember): TeamMemberDto => ({
    id: member.id,
    name: `${member.firstNameFa} ${member.lastNameFa}`.trim(),
    role: member.roleFa,
    photoUrl: member.avatarUrl ?? '',
    order: member.order,
  });

  private async getNextOrder(): Promise<number> {
    const last = await this.prisma.teamMember.findFirst({
      orderBy: [{ order: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      select: { order: true },
    });
    return (last?.order ?? -1) + 1;
  }
}
