import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Express } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { StorageService } from '../infrastructure/storage/storage.service';
import { FileCategory, StoredFile } from '../infrastructure/storage/storage.types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('Upload')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'upload' })
export class UploadController {
  constructor(private readonly storageService: StorageService) { }

  @Post('event-poster')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for event posters
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Event poster image (JPG, PNG, WebP, GIF)',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload event poster',
    description: 'Upload poster image for an event. Returns file URL for use in event creation.',
  })
  @ApiCreatedResponse({
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        url: { type: 'string' },
        filename: { type: 'string' },
        originalName: { type: 'string' },
        size: { type: 'number' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid file', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Not authenticated', type: ErrorResponseDto })
  async uploadEventPoster(@UploadedFile() file: Express.Multer.File): Promise<Partial<StoredFile>> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const stored = await this.storageService.uploadFile(file, {
      category: FileCategory.EVENT_POSTER,
    });

    return {
      id: stored.id,
      url: stored.url,
      filename: stored.filename,
      originalName: stored.originalName,
      size: stored.size,
    };
  }

  @Post('user-avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for avatars
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'User avatar image (JPG, PNG, WebP)',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload user avatar',
    description: 'Upload avatar image for user profile.',
  })
  @ApiCreatedResponse({
    description: 'Avatar uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        url: { type: 'string' },
        filename: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid file', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Not authenticated', type: ErrorResponseDto })
  async uploadUserAvatar(@UploadedFile() file: Express.Multer.File): Promise<Partial<StoredFile>> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const stored = await this.storageService.uploadFile(file, {
      category: FileCategory.USER_AVATAR,
    });

    return {
      id: stored.id,
      url: stored.url,
      filename: stored.filename,
    };
  }

  @Post('team-member')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for team member photos
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Team member image (JPG, PNG, WebP)',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload team member photo',
    description: 'Upload photo for team member profile.',
  })
  @ApiCreatedResponse({
    description: 'Photo uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        url: { type: 'string' },
        filename: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid file', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Not authenticated', type: ErrorResponseDto })
  async uploadTeamMember(@UploadedFile() file: Express.Multer.File): Promise<Partial<StoredFile>> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const stored = await this.storageService.uploadFile(file, {
      category: FileCategory.TEAM_MEMBER,
    });

    return {
      id: stored.id,
      url: stored.url,
      filename: stored.filename,
    };
  }

  @Post('sponsor-logo')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for sponsor logos
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Sponsor logo (JPG, PNG, WebP, SVG)',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload sponsor logo',
    description: 'Upload logo for sponsor.',
  })
  @ApiCreatedResponse({
    description: 'Logo uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        url: { type: 'string' },
        filename: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid file', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Not authenticated', type: ErrorResponseDto })
  async uploadSponsorLogo(@UploadedFile() file: Express.Multer.File): Promise<Partial<StoredFile>> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const stored = await this.storageService.uploadFile(file, {
      category: FileCategory.SPONSOR_LOGO,
    });

    return {
      id: stored.id,
      url: stored.url,
      filename: stored.filename,
    };
  }

  @Delete(':category/:filename')
  @ApiOperation({
    summary: 'Delete uploaded file',
    description: 'Delete a previously uploaded file. Requires admin or owner authorization.',
  })
  @ApiCreatedResponse({ description: 'File deleted successfully' })
  @ApiBadRequestResponse({ description: 'Invalid file path', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Not authenticated', type: ErrorResponseDto })
  async deleteFile(
    @Param('category') category: string,
    @Param('filename') filename: string,
  ): Promise<{ success: boolean }> {
    const filePath = `${category}/${filename}`;
    await this.storageService.deleteFile(filePath);

    return { success: true };
  }
}
