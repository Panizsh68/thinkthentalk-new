import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { TeamMemberDto } from './dto/team-member.dto';
import { TeamMemberFormDataDto, UpdateTeamMemberFormDataDto } from './dto/team-member-form-data.dto';
import { RedisService } from '../infrastructure/cache/redis.service';

@Injectable()
export class TeamMembersService {
  private readonly cacheTtl: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.cacheTtl = Number(this.configService.get('CONTENT_CACHE_TTL_SECONDS') ?? 120);
  }

  async listPublic(): Promise<TeamMemberDto[]> {
    const cacheKey = 'team:list';
    const cached = await this.redis.getJson<TeamMemberDto[]>(cacheKey);
    if (cached) return cached;
    const members = await this.prisma.teamMember.findMany({ orderBy: { createdAt: 'asc' } });
    const dtos = members.map(this.toDto);
    await this.redis.setJson(cacheKey, dtos, this.cacheTtl);
    return dtos;
  }

  async listAdmin(): Promise<TeamMemberDto[]> {
    const members = await this.prisma.teamMember.findMany({ orderBy: { createdAt: 'asc' } });
    return members.map(this.toDto);
  }

  async create(dto: TeamMemberFormDataDto): Promise<TeamMemberDto> {
    const created = await this.prisma.teamMember.create({
      data: {
        name: dto.name,
        role: dto.role,
        photoUrl: dto.photoUrl,
      },
    });
    await this.redis.del('team:list');
    return this.toDto(created);
  }

  async update(id: string, dto: UpdateTeamMemberFormDataDto): Promise<TeamMemberDto | null> {
    const existing = await this.prisma.teamMember.findUnique({ where: { id } });
    if (!existing) return null;

    const updated = await this.prisma.teamMember.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl } : {}),
      },
    });
    await this.redis.del('team:list');
    return this.toDto(updated);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.prisma.teamMember.findUnique({ where: { id } });
    if (!existing) return false;
    await this.prisma.teamMember.delete({ where: { id } });
    await this.redis.del('team:list');
    return true;
  }

  private toDto = (member: { id: string; name: string; role: string; photoUrl: string }): TeamMemberDto => ({
    id: member.id,
    name: member.name,
    role: member.role,
    photoUrl: member.photoUrl,
  });
}
