import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { ModuleStatusDto } from '../common/dto/module-status.dto';

@ApiTags('Content Management')
@Controller({ path: 'content', version: '1' })
export class ContentController {
  constructor(private readonly contentService: ContentService) { }

  @Get('status')
  @ApiOperation({ summary: 'Module status', description: 'Health/status check for the content subsystem.' })
  @ApiOkResponse({ description: 'Content status.', type: ModuleStatusDto })
  status(): ModuleStatusDto {
    return this.contentService.status();
  }
}
