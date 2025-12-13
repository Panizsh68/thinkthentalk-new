/**
 * Storage Types and Interfaces
 * Supports both local and cloud storage
 */

import type { Express } from 'express';

export enum StorageType {
  LOCAL = 'local',
  S3 = 's3',
  AZURE = 'azure',
  GCS = 'gcs',
}

export enum FileCategory {
  EVENT_POSTER = 'events',
  USER_AVATAR = 'users',
  TEAM_MEMBER = 'content/team',
  SPONSOR_LOGO = 'content/sponsors',
  DOCUMENT = 'documents',
  ATTACHMENT = 'attachments',
  EVENT_RESOURCE = 'resources',
}

export interface StoredFile {
  id: string;
  originalName: string;
  filename: string;
  url: string;
  path: string;
  size: number;
  mimetype: string;
  category: FileCategory;
  uploadedAt: Date;
}

export interface StorageUploadOptions {
  category: FileCategory;
  filename?: string;
  public?: boolean;
}

export interface StorageProvider {
  upload(
    file: Express.Multer.File,
    options: StorageUploadOptions,
  ): Promise<StoredFile>;

  delete(filePath: string): Promise<void>;

  getUrl(filePath: string): string;

  getTemporaryUrl(filePath: string, expirationHours?: number): Promise<string>;

  exists(filePath: string): Promise<boolean>;
}

export interface StorageConfig {
  type: StorageType;
  local?: {
    uploadDir: string;
    publicDir: string;
    maxFileSize: number; // bytes
  };
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  azure?: {
    accountName: string;
    accountKey: string;
    containerName: string;
  };
}
