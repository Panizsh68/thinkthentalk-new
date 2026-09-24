import { TeamMember } from '@prisma/client';
import { TeamMembersService } from './team-members.service';
import {
  TeamMemberFormDataDto,
  UpdateTeamMemberFormDataDto,
} from './dto/team-member-form-data.dto';

const createdAt = new Date('2026-09-20T10:00:00.000Z');

const member = {
  id: 'member-1',
  firstNameFa: 'سارا',
  lastNameFa: 'احمدی',
  roleFa: 'مدیر جامعه',
  firstNameEn: 'Sara',
  lastNameEn: 'Ahmadi',
  roleEn: 'Community Lead',
  avatarUrl: 'http://localhost:3000/api/upload/files/team-member/old.jpg',
  displayOrder: 2,
  isActive: true,
  createdAt,
  updatedAt: createdAt,
} as TeamMember;

function makeService() {
  const prisma = {
    teamMember: {
      findMany: jest.fn().mockResolvedValue([member]),
      findFirst: jest.fn().mockResolvedValue({ displayOrder: 2 }),
      findUnique: jest.fn().mockResolvedValue(member),
      create: jest.fn().mockResolvedValue(member),
      update: jest.fn().mockResolvedValue({
        ...member,
        avatarUrl: 'http://localhost:3000/api/upload/files/team-member/new.jpg',
      }),
      delete: jest.fn().mockResolvedValue(member),
    },
    $transaction: jest.fn(),
  };
  const redis = {
    getJson: jest.fn().mockResolvedValue(null),
    setJson: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };
  const storage = { deleteFile: jest.fn().mockResolvedValue(undefined) };
  const service = new TeamMembersService(
    prisma as never,
    redis as never,
    { get: jest.fn().mockReturnValue(120) } as never,
    storage as never,
  );
  return { service, prisma, redis, storage };
}

describe('TeamMembersService', () => {
  it('returns the explicit bilingual contract and preserves ordering', async () => {
    const { service } = makeService();
    const result = await service.listPublic();

    expect(result[0]).toEqual(
      expect.objectContaining({
        firstNameFa: 'سارا',
        lastNameFa: 'احمدی',
        roleFa: 'مدیر جامعه',
        firstNameEn: 'Sara',
        lastNameEn: 'Ahmadi',
        roleEn: 'Community Lead',
        displayOrder: 2,
        isActive: true,
      }),
    );
    expect(result[0]).not.toHaveProperty('name');
    expect(result[0]).not.toHaveProperty('photoUrl');
  });

  it('creates with both language values instead of legacy name/role mappings', async () => {
    const { service, prisma } = makeService();
    const dto = {
      firstNameFa: 'سارا',
      lastNameFa: 'احمدی',
      roleFa: 'مدیر',
      firstNameEn: 'Sara',
      lastNameEn: 'Ahmadi',
      roleEn: 'Lead',
      avatarUrl: '',
      displayOrder: 0,
      isActive: true,
    } as TeamMemberFormDataDto;

    await service.create(dto);
    expect(prisma.teamMember.create).toHaveBeenCalledWith({
      data: {
        firstNameFa: 'سارا',
        lastNameFa: 'احمدی',
        roleFa: 'مدیر',
        firstNameEn: 'Sara',
        lastNameEn: 'Ahmadi',
        roleEn: 'Lead',
        avatarUrl: null,
        displayOrder: 0,
        isActive: true,
      },
    });
  });

  it('updates the database before cleaning up the old image', async () => {
    const { service, prisma, storage } = makeService();
    const dto = {
      avatarUrl: 'http://localhost:3000/api/upload/files/team-member/new.jpg',
    } as UpdateTeamMemberFormDataDto;

    await service.update('member-1', dto);

    expect(prisma.teamMember.update).toHaveBeenCalled();
    expect(storage.deleteFile).toHaveBeenCalledWith('team-member/old.jpg');
    expect(prisma.teamMember.update.mock.invocationCallOrder[0]).toBeLessThan(
      storage.deleteFile.mock.invocationCallOrder[0],
    );
  });

  it('deletes the database resource before attempting media cleanup', async () => {
    const { service, prisma, storage } = makeService();

    await service.delete('member-1');

    expect(prisma.teamMember.delete).toHaveBeenCalledWith({
      where: { id: 'member-1' },
    });
    expect(storage.deleteFile).toHaveBeenCalledWith('team-member/old.jpg');
    expect(prisma.teamMember.delete.mock.invocationCallOrder[0]).toBeLessThan(
      storage.deleteFile.mock.invocationCallOrder[0],
    );
  });
});
