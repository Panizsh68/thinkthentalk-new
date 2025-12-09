import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { ModuleStatusDto } from '../common/dto/module-status.dto';

@ApiTags('Messaging')
@Controller({ path: 'messaging', version: '1' })
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) { }

  @Get('status')
  @ApiOperation({ summary: 'Module status', description: 'Health/status check for the messaging subsystem.' })
  @ApiOkResponse({ description: 'Messaging status.', type: ModuleStatusDto })
  status(): ModuleStatusDto {
    return this.messagingService.status();
  }
}
