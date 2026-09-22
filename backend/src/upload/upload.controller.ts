import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  UseGuards,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Express } from 'express';
import * as path from 'path';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { StorageService } from '../infrastructure/storage/storage.service';
import {
  FileCategory,
  StoredFile,
} from '../infrastructure/storage/storage.types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { resolveExistingUploadFile } from '../infrastructure/storage/upload-paths';

@ApiTags('Upload')
@ApiBearerAuth('bearerAuth')
@Controller({ path: 'upload' })
export class UploadController {
  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.EVENT_MANAGER)
  @Post('event-poster')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for event posters
    }),
  )
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
    description:
      'Upload poster image for an event. Returns file URL for use in event creation.',
  })
  @ApiCreatedResponse({
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        url: { type: 'string' },
        filename: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid file',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Only event administrators may upload event posters',
    type: ErrorResponseDto,
  })
  async uploadEventPoster(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Partial<StoredFile>> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const stored = await this.storageService.uploadFile(file, {
      category: FileCategory.EVENT_POSTER,
    });

    return this.toUploadResponse(stored);
  }

  /*
   * Temporarily disabled user-avatar upload until the feature is needed again.
   * @Post('user-avatar')
   * ...
   * async uploadUserAvatar(...) { ... }
   */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.EVENT_MANAGER)
  @Post('event-resource')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB for resource files
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Event resource file (PDF, DOCX, XLSX, ZIP, PNG, JPG, etc.)',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload event resource file',
    description:
      'Upload a downloadable resource for an event. Returns a URL to attach to the event resources list.',
  })
  @ApiCreatedResponse({
    description: 'Resource uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        url: { type: 'string' },
        filename: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid file',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Only event administrators may upload event resources',
    type: ErrorResponseDto,
  })
  async uploadEventResource(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Partial<StoredFile>> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const stored = await this.storageService.uploadFile(file, {
      category: FileCategory.EVENT_RESOURCE,
    });

    return this.toUploadResponse(stored);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.EVENT_MANAGER, AdminRole.FINANCE)
  @Post('document')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'General document file (PDF, DOC, DOCX, XLS, XLSX)',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload document file',
    description: 'Upload a general-purpose document for admin-managed content.',
  })
  @ApiCreatedResponse({
    description: 'Document uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        url: { type: 'string' },
        filename: { type: 'string' },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Only authorized administrators may upload documents',
    type: ErrorResponseDto,
  })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Partial<StoredFile>> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const stored = await this.storageService.uploadFile(file, {
      category: FileCategory.DOCUMENT,
    });

    return this.toUploadResponse(stored);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN)
  @Post('team-member')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for team member photos
    }),
  )
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
  @ApiBadRequestResponse({
    description: 'Invalid file',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Only administrators may upload team member images',
    type: ErrorResponseDto,
  })
  async uploadTeamMember(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Partial<StoredFile>> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const extension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    if (allowedExtensions[file.mimetype] !== extension) {
      throw new BadRequestException(
        'Team member image extension does not match its MIME type',
      );
    }

    const stored = await this.storageService.uploadFile(file, {
      category: FileCategory.TEAM_MEMBER,
    });

    return this.toUploadResponse(stored);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN)
  @Post('sponsor-logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for sponsor logos
    }),
  )
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
  @ApiBadRequestResponse({
    description: 'Invalid file',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Only administrators may upload sponsor logos',
    type: ErrorResponseDto,
  })
  async uploadSponsorLogo(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Partial<StoredFile>> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const stored = await this.storageService.uploadFile(file, {
      category: FileCategory.SPONSOR_LOGO,
    });

    return this.toUploadResponse(stored);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.EVENT_MANAGER, AdminRole.FINANCE)
  @Post('attachment')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'General attachment file (PDF, image, ZIP, RAR)',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload attachment',
    description:
      'Upload a general-purpose attachment for content and admin workflows.',
  })
  @ApiCreatedResponse({
    description: 'Attachment uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        url: { type: 'string' },
        filename: { type: 'string' },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Only authorized administrators may upload attachments',
    type: ErrorResponseDto,
  })
  async uploadAttachment(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Partial<StoredFile>> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const stored = await this.storageService.uploadFile(file, {
      category: FileCategory.ATTACHMENT,
    });

    return this.toUploadResponse(stored);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':category/:filename')
  @ApiOperation({
    summary: 'Delete uploaded file',
    description:
      'Delete an uploaded file within a role-scoped administrative storage category. File paths are never treated as ownership proof.',
  })
  @ApiCreatedResponse({ description: 'File deleted successfully' })
  @ApiBadRequestResponse({
    description: 'Invalid file path',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The authenticated role cannot delete this storage category',
    type: ErrorResponseDto,
  })
  async deleteFile(
    @Param('category') category: string,
    @Param('filename') filename: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: boolean }> {
    if (user.type !== 'ADMIN') {
      throw new ForbiddenException(
        'Only administrative roles may delete uploaded files',
      );
    }

    const allowedCategories: Partial<Record<FileCategory, AdminRole[]>> = {
      [FileCategory.EVENT_POSTER]: [AdminRole.ADMIN, AdminRole.EVENT_MANAGER],
      [FileCategory.EVENT_RESOURCE]: [AdminRole.ADMIN, AdminRole.EVENT_MANAGER],
      [FileCategory.SPONSOR_LOGO]: [AdminRole.ADMIN],
      [FileCategory.DOCUMENT]: [
        AdminRole.ADMIN,
        AdminRole.EVENT_MANAGER,
        AdminRole.FINANCE,
      ],
      [FileCategory.ATTACHMENT]: [
        AdminRole.ADMIN,
        AdminRole.EVENT_MANAGER,
        AdminRole.FINANCE,
      ],
      [FileCategory.TEAM_MEMBER]: [AdminRole.ADMIN],
    };
    const categoryRoles = allowedCategories[category as FileCategory];
    if (!categoryRoles)
      throw new BadRequestException('Invalid storage category');
    if (!user.role || !categoryRoles.includes(user.role as AdminRole)) {
      throw new ForbiddenException(
        'The authenticated role cannot delete this file category',
      );
    }

    if (
      filename !== path.posix.basename(filename) ||
      filename !== path.basename(filename) ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]{0,254}$/.test(filename) ||
      filename.includes('..')
    ) {
      throw new BadRequestException('Invalid file path');
    }

    const filePath = path.posix.join(category, filename);
    await this.storageService.deleteFile(filePath);

    return { success: true };
  }

  @Get('files/:category/:filename')
  @ApiOperation({
    summary: 'Legacy file access',
    description:
      'Redirect legacy upload URLs to the current public upload location.',
  })
  getLegacyFile(
    @Param('category') category: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ): void {
    const normalizedPath = path.posix.normalize(`${category}/${filename}`);
    if (normalizedPath.startsWith('..') || path.isAbsolute(normalizedPath)) {
      throw new BadRequestException('Invalid file path');
    }

    const legacyMap: Record<string, string> = {
      events: FileCategory.EVENT_POSTER,
      'event-posters': FileCategory.EVENT_POSTER,
      'event-resources': FileCategory.EVENT_RESOURCE,
    };

    const candidates = [category, legacyMap[category]].filter(Boolean);
    const configuredUploadDir = this.configService.get<string>('UPLOADS_DIR');

    for (const candidate of candidates) {
      const candidatePath = path.posix.join(candidate, filename);
      const existingFile = resolveExistingUploadFile(
        candidatePath,
        configuredUploadDir,
      );

      if (!existingFile) {
        continue;
      }
      res.sendFile(existingFile);
      return;
    }

    throw new NotFoundException('File not found');
  }

  private toUploadResponse(stored: StoredFile): Partial<StoredFile> {
    return {
      id: stored.id,
      url: stored.url,
      filename: stored.filename,
      originalName: stored.originalName,
      size: stored.size,
    };
  }
}
