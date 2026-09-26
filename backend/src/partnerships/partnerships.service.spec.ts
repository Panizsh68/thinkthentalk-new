import { ConflictException, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Reflector } from '@nestjs/core';
import { PartnershipStatus } from '@prisma/client';
import { PartnershipsService } from './partnerships.service';
import { PartnershipsController } from './partnerships.controller';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateCollaborationRequestDto } from './dto/create-collaboration-request.dto';
import { UpdatePartnershipStatusDto } from './dto/update-partnership-status.dto';

const now = new Date('2026-09-20T10:00:00.000Z');

const collaborationRecord = {
  id: 'collaboration-1',
  userId: 'user-1',
  name: 'Sara Ahmadi',
  email: 'sara@example.com',
  mobile: '09121234567',
  fieldOfExpertise: 'Content',
  experience: 'Three years',
  whyJoin: 'To help',
  availability: 'Weekends',
  acceptedTerms: true,
  acceptedTermsAt: now,
  status: PartnershipStatus.PENDING,
  adminNotes: null,
  processedAt: null,
  createdAt: now,
  updatedAt: now,
};

function makePrisma() {
  const tx = {
    collaborationRequest: {
      create: jest.fn().mockResolvedValue(collaborationRecord),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(collaborationRecord),
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        ...collaborationRecord,
        statusHistory: [
          {
            id: 'history-1',
            fromStatus: null,
            toStatus: PartnershipStatus.PENDING,
            note: null,
            createdAt: now,
          },
        ],
      }),
      update: jest.fn().mockResolvedValue(collaborationRecord),
    },
    collaborationRequestStatusHistory: {
      create: jest.fn().mockResolvedValue({}),
    },
  };

  return {
    tx,
    prisma: {
      collaborationRequest: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      sponsorshipRequest: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    },
  };
}

describe('PartnershipsService', () => {
  it('validates, normalizes and persists an accepted collaboration request', async () => {
    const dto = plainToInstance(CreateCollaborationRequestDto, {
      firstName: ' Sara ',
      lastName: ' Ahmadi ',
      email: 'sara@example.com',
      mobile: '۰۹۱۲۱۲۳۴۵۶۷',
      fieldOfExpertise: ' Content ',
      whyJoin: ' I want to help ',
      acceptedTerms: true,
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.mobile).toBe('09121234567');

    const { prisma, tx } = makePrisma();
    const service = new PartnershipsService(prisma as never);
    await service.submitCollaboration(dto, 'user-1');

    expect(tx.collaborationRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Sara Ahmadi',
          mobile: '09121234567',
          acceptedTerms: true,
          acceptedTermsAt: expect.any(Date),
        }),
      }),
    );
    expect(tx.collaborationRequestStatusHistory.create).toHaveBeenCalled();
  });

  it('rejects false consent, whitespace, malformed email and invalid status', async () => {
    const dto = plainToInstance(CreateCollaborationRequestDto, {
      firstName: '   ',
      lastName: 'Ahmadi',
      email: 'not-an-email',
      mobile: '09121234567',
      fieldOfExpertise: 'Content',
      whyJoin: 'Why',
      acceptedTerms: false,
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);

    const invalidStatus = plainToInstance(UpdatePartnershipStatusDto, {
      status: 'NOT_A_STATUS',
    });
    expect((await validate(invalidStatus)).length).toBeGreaterThan(0);
  });

  it('rejects a second active collaboration request with a domain conflict', async () => {
    const mockedPrisma = makePrisma();
    mockedPrisma.tx.collaborationRequest.findFirst.mockResolvedValue({
      id: 'existing',
    });
    const dto = plainToInstance(CreateCollaborationRequestDto, {
      firstName: 'Sara',
      lastName: 'Ahmadi',
      email: 'sara@example.com',
      mobile: '09121234567',
      fieldOfExpertise: 'Content',
      whyJoin: 'Why',
      acceptedTerms: true,
    });

    await expect(
      new PartnershipsService(mockedPrisma.prisma as never).submitCollaboration(
        dto,
        'user-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates status and writes history atomically without exposing password data', async () => {
    const { prisma, tx } = makePrisma();
    tx.collaborationRequest.findUnique.mockResolvedValue(collaborationRecord);
    tx.collaborationRequest.findUniqueOrThrow.mockResolvedValue({
      ...collaborationRecord,
      status: PartnershipStatus.REVIEWING,
      adminNotes: 'Status update message',
      user: {
        id: 'user-1',
        firstNameFa: 'Sara',
        lastNameFa: 'Ahmadi',
        email: 'sara@example.com',
        mobile: '09121234567',
      },
      statusHistory: [
        {
          id: 'history-2',
          fromStatus: PartnershipStatus.PENDING,
          toStatus: PartnershipStatus.REVIEWING,
          note: 'Status update message',
          changedByAdminId: 'admin-1',
          createdAt: now,
        },
      ],
    });
    const service = new PartnershipsService(prisma as never);
    const dto = plainToInstance(UpdatePartnershipStatusDto, {
      status: PartnershipStatus.REVIEWING,
      notes: 'Status update message',
    });

    const result = await service.updateCollaborationStatus(
      'collaboration-1',
      dto,
      'admin-1',
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.collaborationRequestStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fromStatus: PartnershipStatus.PENDING,
          toStatus: PartnershipStatus.REVIEWING,
          changedByAdminId: 'admin-1',
        }),
      }),
    );
    expect(result.adminNote).toBe('Status update message');
    expect(result.history[0]).toEqual(
      expect.objectContaining({ note: 'Status update message' }),
    );
    expect(result.user).toEqual({
      id: 'user-1',
      firstName: 'Sara',
      lastName: 'Ahmadi',
      email: 'sara@example.com',
      mobile: '09121234567',
    });
    expect(JSON.stringify(result)).not.toContain('password');
  });

  it('does not turn an unknown collaboration into an ORM error', async () => {
    const { prisma, tx } = makePrisma();
    tx.collaborationRequest.findUnique.mockResolvedValue(null);
    const service = new PartnershipsService(prisma as never);
    const dto = plainToInstance(UpdatePartnershipStatusDto, {
      status: PartnershipStatus.REVIEWING,
    });
    await expect(
      service.updateCollaborationStatus('missing', dto, 'admin-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('restricts user history to the authenticated user and keeps admin list data safe', async () => {
    const { prisma } = makePrisma();
    prisma.collaborationRequest.findMany.mockResolvedValue([
      {
        ...collaborationRecord,
        statusHistory: [
          {
            id: 'history-1',
            fromStatus: null,
            toStatus: PartnershipStatus.PENDING,
            note: 'Welcome — your request is in the queue.',
            createdAt: now,
          },
        ],
      },
    ]);
    const service = new PartnershipsService(prisma as never);

    const userItems = await service.listUserCollaborations('user-1');
    expect(prisma.collaborationRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );
    expect(userItems[0]).not.toHaveProperty('adminNote');
    expect(userItems[0].history[0]).toEqual(
      expect.objectContaining({
        note: 'Welcome — your request is in the queue.',
      }),
    );
    expect(JSON.stringify(userItems)).not.toContain('password');

    prisma.collaborationRequest.findMany.mockResolvedValue([
      {
        ...collaborationRecord,
        user: {
          id: 'user-1',
          firstNameFa: 'Sara',
          lastNameFa: 'Ahmadi',
          email: 'sara@example.com',
          mobile: '09121234567',
        },
        statusHistory: [],
      },
    ]);
    const adminPage = await service.listCollaborations({ page: 1, limit: 20 });
    expect(adminPage.items[0].user).toEqual({
      id: 'user-1',
      firstName: 'Sara',
      lastName: 'Ahmadi',
      email: 'sara@example.com',
      mobile: '09121234567',
    });
    expect(JSON.stringify(adminPage)).not.toContain('password');
  });

  it('does not let finance review collaboration requests', () => {
    const guard = new RolesGuard(new Reflector());
    const context = {
      getHandler: () => PartnershipsController.prototype.listCollaborations,
      getClass: () => PartnershipsController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { type: 'ADMIN', role: 'FINANCE' } }),
      }),
    } as never;

    expect(guard.canActivate(context)).toBe(false);
  });
});
