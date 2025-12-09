import { Module } from '@nestjs/common';
import { IppanelService } from './ippanel.service';

@Module({
  providers: [IppanelService],
  exports: [IppanelService],
})
export class SmsModule {}
