import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TeamMembersService } from './team-members.service';
import { TeamMemberDto } from './dto/team-member.dto';

@ApiTags('Content Management')
@Controller({ path: 'team', version: '1' })
export class TeamController {
  constructor(private readonly teamMembersService: TeamMembersService) { }

  @Get()
  @ApiOperation({ summary: 'List Public Team Members', description: 'Retrieves the list of team members for public display.' })
  @ApiOkResponse({ description: 'A list of team members.', type: TeamMemberDto, isArray: true })
  async listTeam(): Promise<TeamMemberDto[]> {
    return this.teamMembersService.listPublic();
  }
}
