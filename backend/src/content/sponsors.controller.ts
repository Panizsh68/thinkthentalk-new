import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SponsorDto } from './dto/sponsor.dto';
import { SponsorsService } from './sponsors.service';

@ApiTags('Content Management')
@Controller({ path: 'sponsors', version: '1' })
export class SponsorsController {
  constructor(private readonly sponsorsService: SponsorsService) {}

  @Get()
  @ApiOperation({
    summary: 'List Public Sponsors',
    description: 'Retrieves the list of public sponsors.',
  })
  @ApiOkResponse({
    description: 'A list of sponsors.',
    type: SponsorDto,
    isArray: true,
  })
  async listSponsors(): Promise<SponsorDto[]> {
    return this.sponsorsService.listPublic();
  }
}
