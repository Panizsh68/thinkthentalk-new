import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import type { Express } from 'express';
import {
  StorageProvider,
  StoredFile,
  StorageUploadOptions,
  FileCategory,
} from './storage.types';
import { resolvePrimaryUploadDir } from './upload-paths';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;
  private publicDir: string;
  private maxFileSize: number;
  private baseUrl: string;

  constructor(private configService: ConfigService) {
    const configuredUploadDir = this.configService.get<string>('UPLOADS_DIR');
    const configuredPublicPath =
      this.configService.get<string>('PUBLIC_UPLOAD_PATH');

    this.uploadDir = resolvePrimaryUploadDir(configuredUploadDir);

    const normalizedPublicPath = configuredPublicPath ?? '/uploads';
    this.publicDir = normalizedPublicPath.startsWith('/')
      ? normalizedPublicPath
      : `/${normalizedPublicPath}`;
    this.maxFileSize = 50 * 1024 * 1024; // 50MB default
    this.baseUrl =
      this.configService.get<string>('APP_URL') || 'http://localhost:3000';
  }

  async upload(
    file: Express.Multer.File,
    options: StorageUploadOptions,
  ): Promise<StoredFile> {
    // Validate file
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum limit of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    const validMimeTypes = this.getValidMimeTypes(options.category);
    if (!validMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${validMimeTypes.join(', ')}`,
      );
    }

    // Create category directory
    const categoryDir = path.join(this.uploadDir, options.category);
    await this.ensureDirectoryExists(categoryDir);

    // Generate filename
    const fileExtension = path.extname(file.originalname);
    const filename = options.filename || `${randomUUID()}${fileExtension}`;
    const filePath = path.join(categoryDir, filename);
    const relativePath = path.posix.join(options.category, filename);

    // Save file
    await fs.writeFile(filePath, file.buffer);

    return {
      id: randomUUID(),
      originalName: file.originalname,
      filename,
      url: this.getUrl(relativePath),
      path: relativePath,
      size: file.size,
      mimetype: file.mimetype,
      category: options.category,
      uploadedAt: new Date(),
    };
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, filePath);

    try {
      await fs.unlink(fullPath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, ignore
    }
  }

  getUrl(filePath: string): string {
    const normalizedBase = this.normalizeBaseUrl(this.baseUrl);
    const normalizedPublicDir = this.normalizePublicDir(this.publicDir);
    const normalizedPath = this.normalizeFilePath(filePath);
    return `${normalizedBase}${normalizedPublicDir}/${normalizedPath}`;
  }

  async getTemporaryUrl(
    filePath: string,
    expirationHours: number = 24,
  ): Promise<string> {
    // Local storage doesn't support temporary URLs, return permanent URL
    return this.getUrl(filePath);
  }

  async exists(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.uploadDir, filePath);

    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  // Helper methods

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  private normalizeBaseUrl(baseUrl: string): string {
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  private normalizePublicDir(publicDir: string): string {
    if (!publicDir) {
      return '';
    }
    const withLeadingSlash = publicDir.startsWith('/')
      ? publicDir
      : `/${publicDir}`;
    return withLeadingSlash.endsWith('/')
      ? withLeadingSlash.slice(0, -1)
      : withLeadingSlash;
  }

  private normalizeFilePath(filePath: string): string {
    const normalized = filePath.replace(/\\/g, '/');
    return path.posix.normalize(normalized).replace(/^\/+/, '');
  }

  private getValidMimeTypes(category: FileCategory): string[] {
    const mimeTypeMap: Record<FileCategory, string[]> = {
      [FileCategory.EVENT_POSTER]: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
      ],
      [FileCategory.USER_AVATAR]: ['image/jpeg', 'image/png', 'image/webp'],
      [FileCategory.TEAM_MEMBER]: ['image/jpeg', 'image/png', 'image/webp'],
      [FileCategory.SPONSOR_LOGO]: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/svg+xml',
      ],
      [FileCategory.DOCUMENT]: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      [FileCategory.ATTACHMENT]: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/zip',
        'application/x-rar-compressed',
      ],
      [FileCategory.EVENT_RESOURCE]: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'application/x-rar-compressed',
        'application/json',
        'text/plain',
        'image/jpeg',
        'image/png',
      ],
    };

    return mimeTypeMap[category] || ['*/*'];
  }
}
