import { Module } from '@nestjs/common';
import { StorageModule } from '../infrastructure/storage/storage.module';
import { UploadController } from './upload.controller';

@Module({
  imports: [StorageModule],
  controllers: [UploadController],
})
export class UploadModule { }
