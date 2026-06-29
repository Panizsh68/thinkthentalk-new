import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { CreateEventIdeaDto } from './dto/create-event-idea.dto';
import { EventIdeaStatus, EventIdeaType } from '@prisma/client';

@Injectable()
export class EventIdeasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEventIdeaDto, userId?: string) {
    return this.prisma.eventIdea.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        userId: userId ?? null,
        name: dto.name,
        email: dto.email,
        status: EventIdeaStatus.PENDING,
      },
    });
  }

  async findAll(filters: {
    status?: EventIdeaStatus;
    type?: EventIdeaType;
    page?: number;
    limit?: number;
  }) {
    const { status, type, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.eventIdea.findMany({
        where: {
          ...(status ? { status } : {}),
          ...(type ? { type } : {}),
        },
        include: {
          user: {
            select: {
              id: true,
              firstNameFa: true,
              lastNameFa: true,
              mobile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.eventIdea.count({
        where: {
          ...(status ? { status } : {}),
          ...(type ? { type } : {}),
        },
      }),
    ]);

    return { items, total, page, limit };
  }

  async updateStatus(id: string, status: EventIdeaStatus) {
    const idea = await this.prisma.eventIdea.findUnique({ where: { id } });
    if (!idea) throw new NotFoundException('Idea not found');

    return this.prisma.eventIdea.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string) {
    const idea = await this.prisma.eventIdea.findUnique({ where: { id } });
    if (!idea) throw new NotFoundException('Idea not found');

    return this.prisma.eventIdea.delete({ where: { id } });
  }
}
