import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { TeamMembersService } from './team-members.service';
import { TeamMemberDto } from './dto/team-member.dto';
import { TeamMemberFormDataDto, UpdateTeamMemberFormDataDto } from './dto/team-member-form-data.dto';

@ApiTags('Content Management')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN, AdminRole.EVENT_MANAGER, AdminRole.FINANCE)
@Controller({ path: 'admin/team', version: '1' })
export class AdminTeamController {
  constructor(private readonly teamMembersService: TeamMembersService) { }

  @Get()
  @ApiOperation({ summary: 'List All Team Members (Admin)', description: 'Retrieves all team members for the admin panel.' })
  @ApiOkResponse({ description: 'A list of all team members.', type: TeamMemberDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async list(): Promise<TeamMemberDto[]> {
    return this.teamMembersService.listAdmin();
  }

  @Post()
  @ApiOperation({ summary: 'Create Team Member (Admin)', description: 'Adds a new team member.' })
  @ApiBody({ type: TeamMemberFormDataDto, required: true })
  @ApiCreatedResponse({ description: 'Team member created.', type: TeamMemberDto })
  @ApiBadRequestResponse({ description: 'Invalid data.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async create(@Body() dto: TeamMemberFormDataDto): Promise<TeamMemberDto> {
    return this.teamMembersService.create(dto);
  }

  @Patch(':memberId')
  @ApiOperation({ summary: 'Update Team Member (Admin)', description: 'Updates an existing team member\'s details.' })
  @ApiParam({ name: 'memberId', type: String, required: true })
  @ApiBody({ type: UpdateTeamMemberFormDataDto, required: true })
  @ApiOkResponse({ description: 'Team member updated.', type: TeamMemberDto })
  @ApiNotFoundResponse({ description: 'Team member not found.', type: ErrorResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid data.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async update(
    @Param('memberId') memberId: string,
    @Body() dto: UpdateTeamMemberFormDataDto,
  ): Promise<TeamMemberDto> {
    const updated = await this.teamMembersService.update(memberId, dto);
    if (!updated) {
      throw new NotFoundException('Team member not found.');
    }
    return updated;
  }

  @Delete(':memberId')
  @ApiOperation({ summary: 'Delete Team Member (Admin)', description: 'Deletes a team member.' })
  @ApiParam({ name: 'memberId', type: String, required: true })
  @ApiNoContentResponse({ description: 'Team member deleted.' })
  @ApiNotFoundResponse({ description: 'Team member not found.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async delete(@Param('memberId') memberId: string): Promise<void> {
    const deleted = await this.teamMembersService.delete(memberId);
    if (!deleted) {
      throw new NotFoundException('Team member not found.');
    }
  }
}
