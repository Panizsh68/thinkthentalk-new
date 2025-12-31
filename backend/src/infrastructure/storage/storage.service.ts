import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Express } from 'express';
import {
  StorageProvider,
  StoredFile,
  StorageUploadOptions,
  StorageType,
} from './storage.types';
import { LocalStorageProvider } from './local-storage.provider';
import { CloudStorageProvider } from './cloud-storage.provider';

@Injectable()
export class StorageService {
  private provider: StorageProvider;

  constructor(
    private configService: ConfigService,
    private localStorageProvider: LocalStorageProvider,
    private cloudStorageProvider: CloudStorageProvider,
  ) {
    // Initialize provider based on environment
    const storageType =
      this.configService.get<string>('STORAGE_TYPE') || StorageType.LOCAL;

    if (storageType === StorageType.LOCAL) {
      this.provider = this.localStorageProvider;
    } else {
      // S3, Azure, GCS, etc.
      this.provider = this.cloudStorageProvider;
    }
  }

  /**
   * Upload file to storage
   */
  async uploadFile(
    file: Express.Multer.File,
    options: StorageUploadOptions,
  ): Promise<StoredFile> {
    return this.provider.upload(file, options);
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filePath: string): Promise<void> {
    return this.provider.delete(filePath);
  }

  /**
   * Get public URL for file
   */
  getFileUrl(filePath: string): string {
    return this.provider.getUrl(filePath);
  }

  /**
   * Get temporary URL with expiration (useful for private files)
   */
  async getTemporaryFileUrl(
    filePath: string,
    expirationHours?: number,
  ): Promise<string> {
    return this.provider.getTemporaryUrl(filePath, expirationHours);
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    return this.provider.exists(filePath);
  }

  /**
   * Switch storage provider (useful for migrations)
   */
  switchProvider(storageType: StorageType): void {
    if (storageType === StorageType.LOCAL) {
      this.provider = this.localStorageProvider;
    } else {
      this.provider = this.cloudStorageProvider;
    }
  }
}
