import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PartnershipStatus, Prisma, SponsorshipPlan } from '@prisma/client';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { CreateCollaborationRequestDto } from './dto/create-collaboration-request.dto';
import { CreateSponsorshipRequestDto } from './dto/create-sponsorship-request.dto';
import { PartnershipQueryDto } from './dto/partnership-query.dto';
import { UpdatePartnershipStatusDto } from './dto/update-partnership-status.dto';

const ACTIVE_COLLABORATION_STATUSES: PartnershipStatus[] = [
  PartnershipStatus.PENDING,
  PartnershipStatus.REVIEWING,
  PartnershipStatus.CONTACTED,
];

const safeUserSelect = {
  id: true,
  firstNameFa: true,
  lastNameFa: true,
  email: true,
  mobile: true,
} satisfies Prisma.UserSelect;

const userHistorySelect = {
  id: true,
  fromStatus: true,
  toStatus: true,
  note: true,
  createdAt: true,
} satisfies Prisma.CollaborationRequestStatusHistorySelect;

const adminHistorySelect = {
  id: true,
  fromStatus: true,
  toStatus: true,
  note: true,
  changedByAdminId: true,
  createdAt: true,
} satisfies Prisma.CollaborationRequestStatusHistorySelect;

type CollaborationUserRecord = Prisma.CollaborationRequestGetPayload<{
  include: { statusHistory: { select: typeof userHistorySelect } };
}>;

type CollaborationAdminRecord = Prisma.CollaborationRequestGetPayload<{
  include: {
    user: { select: typeof safeUserSelect };
    statusHistory: { select: typeof adminHistorySelect };
  };
}>;

type SponsorshipAdminRecord = Prisma.SponsorshipRequestGetPayload<{
  include: { user: { select: typeof safeUserSelect } };
}>;

@Injectable()
export class PartnershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async submitCollaboration(
    dto: CreateCollaborationRequestDto,
    userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('A user account is required');

    const now = new Date();
    const name = `${dto.firstName} ${dto.lastName}`.trim();
    try {
      const created = await this.prisma.$transaction(
        async (tx) => {
          // Keep the duplicate check and insert in one serializable
          // transaction so concurrent submissions cannot both pass the check.
          const existingActive = await tx.collaborationRequest.findFirst({
            where: {
              userId,
              status: { in: ACTIVE_COLLABORATION_STATUSES },
            },
            select: { id: true },
          });

          if (existingActive) {
            throw new ConflictException(
              'You already have an active collaboration request',
            );
          }

          const request = await tx.collaborationRequest.create({
            data: {
              userId,
              name,
              email: dto.email,
              mobile: dto.mobile,
              fieldOfExpertise: dto.fieldOfExpertise,
              experience: dto.experience,
              whyJoin: dto.whyJoin,
              availability: dto.availability,
              acceptedTerms: dto.acceptedTerms,
              acceptedTermsAt: now,
            },
          });

          await tx.collaborationRequestStatusHistory.create({
            data: {
              collaborationRequestId: request.id,
              fromStatus: null,
              toStatus: request.status,
              changedByAdminId: null,
            },
          });

          return tx.collaborationRequest.findUniqueOrThrow({
            where: { id: request.id },
            include: { statusHistory: { select: userHistorySelect } },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      return this.toCollaborationUserResponse(created);
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new ConflictException(
          'You already have an active collaboration request',
        );
      }
      throw error;
    }
  }

  async submitSponsorship(dto: CreateSponsorshipRequestDto, userId: string) {
    if (!userId) throw new UnauthorizedException('A user account is required');

    const created = await this.prisma.sponsorshipRequest.create({
      data: {
        userId,
        companyName: dto.companyName,
        representativeName: dto.representativeName,
        email: dto.email,
        mobile: dto.mobile,
        plan: dto.plan,
        description: dto.description,
      },
    });

    return this.toSponsorshipUserResponse(created);
  }

  async listCollaborations(query: PartnershipQueryDto) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.CollaborationRequestWhereInput = status
      ? { status }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.collaborationRequest.findMany({
        where,
        include: {
          user: { select: safeUserSelect },
          statusHistory: {
            orderBy: { createdAt: 'asc' },
            select: adminHistorySelect,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.collaborationRequest.count({ where }),
    ]);

    return {
      items: (items as CollaborationAdminRecord[]).map((item) =>
        this.toCollaborationAdminResponse(item),
      ),
      total,
      page,
      limit,
    };
  }

  async listUserCollaborations(userId: string) {
    const items = await this.prisma.collaborationRequest.findMany({
      where: { userId },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          select: userHistorySelect,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return (items as CollaborationUserRecord[]).map((item) =>
      this.toCollaborationUserResponse(item),
    );
  }

  async getUserCollaborationHistory(userId: string, id: string) {
    const request = await this.prisma.collaborationRequest.findFirst({
      where: { id, userId },
      select: {
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          select: userHistorySelect,
        },
      },
    });

    if (!request)
      throw new NotFoundException('Collaboration request not found');
    return request.statusHistory;
  }

  async listSponsorships(query: PartnershipQueryDto) {
    const { status, plan, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.SponsorshipRequestWhereInput = {
      ...(status ? { status } : {}),
      ...(plan ? { plan } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.sponsorshipRequest.findMany({
        where,
        include: { user: { select: safeUserSelect } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sponsorshipRequest.count({ where }),
    ]);

    return {
      items: (items as SponsorshipAdminRecord[]).map((item) =>
        this.toSponsorshipAdminResponse(item),
      ),
      total,
      page,
      limit,
    };
  }

  async listUserSponsorships(userId: string) {
    const items = await this.prisma.sponsorshipRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => this.toSponsorshipUserResponse(item));
  }

  async updateCollaborationStatus(
    id: string,
    dto: UpdatePartnershipStatusDto,
    changedByAdminId: string,
  ) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const request = await tx.collaborationRequest.findUnique({
        where: { id },
      });
      if (!request)
        throw new NotFoundException('Collaboration request not found');

      await tx.collaborationRequest.update({
        where: { id },
        data: {
          status: dto.status,
          ...(dto.notes !== undefined ? { adminNotes: dto.notes } : {}),
          processedAt: new Date(),
        },
      });

      await tx.collaborationRequestStatusHistory.create({
        data: {
          collaborationRequestId: id,
          fromStatus: request.status,
          toStatus: dto.status,
          note: dto.notes,
          changedByAdminId,
        },
      });

      return tx.collaborationRequest.findUniqueOrThrow({
        where: { id },
        include: {
          user: { select: safeUserSelect },
          statusHistory: {
            orderBy: { createdAt: 'asc' },
            select: adminHistorySelect,
          },
        },
      });
    });

    return this.toCollaborationAdminResponse(
      updated as CollaborationAdminRecord,
    );
  }

  async updateSponsorshipStatus(id: string, dto: UpdatePartnershipStatusDto) {
    const request = await this.prisma.sponsorshipRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException('Sponsorship request not found');

    const updated = await this.prisma.sponsorshipRequest.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.notes !== undefined ? { adminNotes: dto.notes } : {}),
        processedAt: new Date(),
      },
      include: { user: { select: safeUserSelect } },
    });

    return this.toSponsorshipAdminResponse(updated as SponsorshipAdminRecord);
  }

  private toCollaborationUserResponse(item: CollaborationUserRecord) {
    const { firstName, lastName } = this.splitName(item.name);
    return {
      id: item.id,
      name: item.name,
      firstName,
      lastName,
      email: item.email,
      mobile: item.mobile,
      fieldOfExpertise: item.fieldOfExpertise,
      experience: item.experience,
      whyJoin: item.whyJoin,
      availability: item.availability,
      acceptedTerms: item.acceptedTerms,
      acceptedTermsAt: item.acceptedTermsAt,
      status: item.status,
      processedAt: item.processedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      history: item.statusHistory.map((history) => ({
        id: history.id,
        fromStatus: history.fromStatus,
        toStatus: history.toStatus,
        note: history.note,
        createdAt: history.createdAt,
      })),
    };
  }

  private toCollaborationAdminResponse(item: CollaborationAdminRecord) {
    return {
      ...this.toCollaborationUserResponse(item),
      user: item.user ? this.toSafeUserSummary(item.user) : null,
      adminNote: item.adminNotes,
      history: item.statusHistory.map((history) => ({
        id: history.id,
        fromStatus: history.fromStatus,
        toStatus: history.toStatus,
        note: history.note,
        changedByAdminId: history.changedByAdminId,
        createdAt: history.createdAt,
      })),
    };
  }

  private toSponsorshipUserResponse(item: {
    id: string;
    companyName: string;
    representativeName: string;
    email: string;
    mobile: string;
    plan: SponsorshipPlan;
    description: string | null;
    status: PartnershipStatus;
    processedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: item.id,
      companyName: item.companyName,
      representativeName: item.representativeName,
      email: item.email,
      mobile: item.mobile,
      plan: item.plan,
      description: item.description,
      status: item.status,
      processedAt: item.processedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private toSponsorshipAdminResponse(item: SponsorshipAdminRecord) {
    return {
      ...this.toSponsorshipUserResponse(item),
      user: item.user ? this.toSafeUserSummary(item.user) : null,
      adminNote: item.adminNotes,
    };
  }

  private toSafeUserSummary(user: {
    id: string;
    firstNameFa: string;
    lastNameFa: string;
    email: string | null;
    mobile: string;
  }) {
    return {
      id: user.id,
      firstName: user.firstNameFa,
      lastName: user.lastNameFa,
      email: user.email,
      mobile: user.mobile,
    };
  }

  private splitName(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return {
      firstName: parts.shift() ?? '',
      lastName: parts.join(' '),
    };
  }
}
