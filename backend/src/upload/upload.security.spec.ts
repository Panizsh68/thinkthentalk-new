import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from '@prisma/client';
import type { Express } from 'express';
import { UploadController } from './upload.controller';
import { RolesGuard } from '../common/guards/roles.guard';

function contextFor(handler: unknown, user: unknown) {
  return {
    getHandler: () => handler,
    getClass: () => UploadController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as never;
}

describe('Upload security', () => {
  it('does not allow a normal user through the team image role guard', () => {
    const guard = new RolesGuard(new Reflector());
    expect(
      guard.canActivate(
        contextFor(UploadController.prototype.uploadTeamMember, {
          type: 'USER',
        }),
      ),
    ).toBe(false);
  });

  it('allows an admin to delete a team file but blocks users and traversal', async () => {
    const storage = { deleteFile: jest.fn().mockResolvedValue(undefined) };
    const controller = new UploadController(storage as never, {} as never);

    await expect(
      controller.deleteFile('team-member', 'team.jpg', {
        type: 'USER',
        sub: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      controller.deleteFile('team-member', '../team.jpg', {
        type: 'ADMIN',
        role: AdminRole.ADMIN,
        sub: 'admin-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await controller.deleteFile('team-member', 'team.jpg', {
      type: 'ADMIN',
      role: AdminRole.ADMIN,
      sub: 'admin-1',
    });
    expect(storage.deleteFile).toHaveBeenCalledWith('team-member/team.jpg');
  });

  it('accepts only matching team image MIME/extension pairs', async () => {
    const storage = {
      uploadFile: jest.fn().mockResolvedValue({
        id: 'file-1',
        url: '/api/upload/files/team-member/file.jpg',
        filename: 'file.jpg',
        originalName: 'profile.jpg',
        size: 10,
      }),
    };
    const controller = new UploadController(storage as never, {} as never);

    await controller.uploadTeamMember({
      originalname: 'profile.jpg',
      mimetype: 'image/jpeg',
      size: 10,
      buffer: Buffer.from('image'),
    } as Express.Multer.File);
    expect(storage.uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({ originalname: 'profile.jpg' }),
      { category: 'team-member' },
    );

    await expect(
      controller.uploadTeamMember({
        originalname: 'profile.png',
        mimetype: 'image/jpeg',
        size: 10,
        buffer: Buffer.from('image'),
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
