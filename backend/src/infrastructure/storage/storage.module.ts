import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import { LocalStorageProvider } from './local-storage.provider';
import { CloudStorageProvider } from './cloud-storage.provider';

@Module({
  imports: [ConfigModule],
  providers: [StorageService, LocalStorageProvider, CloudStorageProvider],
  exports: [StorageService],
})
export class StorageModule { }
