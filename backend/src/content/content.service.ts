import { Injectable } from '@nestjs/common';

@Injectable()
export class ContentService {
  status(): { status: 'ok'; module: string; timestamp: string } {
    return {
      status: 'ok',
      module: 'content',
      timestamp: new Date().toISOString(),
    };
  }
}
