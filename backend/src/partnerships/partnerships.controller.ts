import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole, PartnershipStatus, SponsorshipPlan } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PartnershipsService } from './partnerships.service';

@ApiTags('Partnerships')
@Controller({ path: 'partnerships', version: '1' })
export class PartnershipsController {
  constructor(private readonly partnershipsService: PartnershipsService) {}

  @Post('collaborate')
  @ApiOperation({ summary: 'Submit a team/moderator application' })
  async collaborate(@Body() dto: any, @CurrentUser() user: any) {
    return this.partnershipsService.submitCollaboration(dto, user?.sub);
  }

  @Post('sponsor')
  @ApiOperation({ summary: 'Submit a sponsorship request' })
  async sponsor(@Body() dto: any, @CurrentUser() user: any) {
    return this.partnershipsService.submitSponsorship(dto, user?.sub);
  }

  @Get('admin/collaborations')
  @ApiBearerAuth('bearerAuth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN)
  async listCollaborations(
    @Query('status') status: PartnershipStatus,
    @Query('page') page: number,
  ) {
    return this.partnershipsService.listCollaborations({ status, page });
  }

  @Get('admin/sponsorships')
  @ApiBearerAuth('bearerAuth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.FINANCE)
  async listSponsorships(
    @Query('status') status: PartnershipStatus,
    @Query('plan') plan: SponsorshipPlan,
    @Query('page') page: number,
  ) {
    return this.partnershipsService.listSponsorships({ status, plan, page });
  }

  @Patch('admin/collaborations/:id/status')
  @ApiBearerAuth('bearerAuth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN)
  async updateCollabStatus(@Param('id') id: string, @Body() body: any) {
    return this.partnershipsService.updateCollaborationStatus(
      id,
      body.status,
      body.notes,
    );
  }

  @Patch('admin/sponsorships/:id/status')
  @ApiBearerAuth('bearerAuth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.FINANCE)
  async updateSponsorStatus(@Param('id') id: string, @Body() body: any) {
    return this.partnershipsService.updateSponsorshipStatus(
      id,
      body.status,
      body.notes,
    );
  }
}
