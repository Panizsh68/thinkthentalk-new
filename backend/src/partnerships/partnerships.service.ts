import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { PartnershipStatus, SponsorshipPlan } from '@prisma/client';

@Injectable()
export class PartnershipsService {
  constructor(private readonly prisma: PrismaService) { }

  async submitCollaboration(dto: any, userId?: string) {
    const { acceptedTerms: _acceptedTerms, ...safeDto } = dto;

    return this.prisma.collaborationRequest.create({
      data: {
        ...safeDto,
        userId: userId ?? null,
      },
    });
  }

  async submitSponsorship(dto: any, userId?: string) {
    const { acceptedTerms: _acceptedTerms, ...safeDto } = dto;

    return this.prisma.sponsorshipRequest.create({
      data: {
        ...safeDto,
        userId: userId ?? null,
      },
    });
  }

  async listCollaborations(filters: any) {
    const { status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      this.prisma.collaborationRequest.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.collaborationRequest.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async listSponsorships(filters: any) {
    const { status, plan, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    const where = {
      ...(status ? { status } : {}),
      ...(plan ? { plan } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.sponsorshipRequest.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sponsorshipRequest.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async updateCollaborationStatus(
    id: string,
    status: PartnershipStatus,
    notes?: string,
  ) {
    const request = await this.prisma.collaborationRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException('Request not found');

    return this.prisma.collaborationRequest.update({
      where: { id },
      data: {
        status,
        notes,
        processedAt: new Date(),
      },
    });
  }

  async updateSponsorshipStatus(
    id: string,
    status: PartnershipStatus,
    notes?: string,
  ) {
    const request = await this.prisma.sponsorshipRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException('Request not found');

    return this.prisma.sponsorshipRequest.update({
      where: { id },
      data: {
        status,
        notes,
        processedAt: new Date(),
      },
    });
  }
}
