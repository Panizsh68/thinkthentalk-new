import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
  NotFoundException,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Express } from 'express';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs/promises';
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
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../infrastructure/storage/storage.service';
import {
  FileCategory,
  StoredFile,
} from '../infrastructure/storage/storage.types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('Upload')
@ApiBearerAuth('bearerAuth')
@Controller({ path: 'upload' })
export class UploadController {
  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard)
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
        originalName: { type: 'string' },
        size: { type: 'number' },
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
  async uploadEventPoster(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Partial<StoredFile>> {
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

  /*
   * Temporarily disabled user-avatar upload until the feature is needed again.
   * @Post('user-avatar')
   * ...
   * async uploadUserAvatar(...) { ... }
   */

  @UseGuards(JwtAuthGuard)
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
        originalName: { type: 'string' },
        size: { type: 'number' },
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
  async uploadEventResource(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Partial<StoredFile>> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const stored = await this.storageService.uploadFile(file, {
      category: FileCategory.EVENT_RESOURCE,
    });

    return {
      id: stored.id,
      url: stored.url,
      filename: stored.filename,
      originalName: stored.originalName,
      size: stored.size,
    };
  }

  @UseGuards(JwtAuthGuard)
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
  async uploadTeamMember(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Partial<StoredFile>> {
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

  @Get('files/:category/:filename')
  async serveUploadedFile(
    @Param('category') category: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    const uploadsDir = this.configService.get<string>('UPLOADS_DIR')
      ? path.resolve(this.configService.get<string>('UPLOADS_DIR') as string)
      : path.join(process.cwd(), 'uploads');

    const safeCategory = category.replace(/\.\./g, '');
    const filePath = path.join(uploadsDir, safeCategory, filename);

    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException('File not found');
    }

    res.sendFile(filePath);
  }

  @UseGuards(JwtAuthGuard)
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
  async uploadSponsorLogo(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Partial<StoredFile>> {
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

  @UseGuards(JwtAuthGuard)
  @Delete(':category/:filename')
  @ApiOperation({
    summary: 'Delete uploaded file',
    description:
      'Delete a previously uploaded file. Requires admin or owner authorization.',
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
  async deleteFile(
    @Param('category') category: string,
    @Param('filename') filename: string,
  ): Promise<{ success: boolean }> {
    const filePath = `${category}/${filename}`;
    await this.storageService.deleteFile(filePath);

    return { success: true };
  }
}
