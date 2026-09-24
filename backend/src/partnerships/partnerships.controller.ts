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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import type { JwtPayload } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserJwtAuthGuard } from '../common/guards/user-jwt-auth.guard';
import { CreateCollaborationRequestDto } from './dto/create-collaboration-request.dto';
import { CreateSponsorshipRequestDto } from './dto/create-sponsorship-request.dto';
import { PartnershipQueryDto } from './dto/partnership-query.dto';
import {
  CollaborationAdminPageDto,
  CollaborationAdminResponseDto,
  CollaborationStatusHistoryDto,
  CollaborationUserResponseDto,
  SponsorshipAdminPageDto,
  SponsorshipAdminResponseDto,
  SponsorshipUserResponseDto,
} from './dto/partnership-response.dto';
import { UpdatePartnershipStatusDto } from './dto/update-partnership-status.dto';
import { PartnershipsService } from './partnerships.service';

@ApiTags('Partnerships')
@Controller({ path: 'partnerships', version: '1' })
export class PartnershipsController {
  constructor(private readonly partnershipsService: PartnershipsService) {}

  @Post('collaborate')
  @ApiBearerAuth('bearerAuth')
  @UseGuards(UserJwtAuthGuard)
  @ApiOperation({ summary: 'Submit a request to join the team' })
  @ApiCreatedResponse({ type: CollaborationUserResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({
    description: 'The user already has an active request',
    type: ErrorResponseDto,
  })
  async collaborate(
    @Body() dto: CreateCollaborationRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.partnershipsService.submitCollaboration(dto, user.sub);
  }

  @Post('sponsor')
  @ApiBearerAuth('bearerAuth')
  @UseGuards(UserJwtAuthGuard)
  @ApiOperation({ summary: 'Submit a sponsorship request' })
  @ApiCreatedResponse({ type: SponsorshipUserResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  async sponsor(
    @Body() dto: CreateSponsorshipRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.partnershipsService.submitSponsorship(dto, user.sub);
  }

  @Get('me/collaborations')
  @ApiBearerAuth('bearerAuth')
  @UseGuards(UserJwtAuthGuard)
  @ApiOperation({
    summary: "List the authenticated user's collaboration requests",
  })
  @ApiOkResponse({ type: CollaborationUserResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  async listMyCollaborations(@CurrentUser() user: JwtPayload) {
    return this.partnershipsService.listUserCollaborations(user.sub);
  }

  @Get('me/collaborations/:id/history')
  @ApiBearerAuth('bearerAuth')
  @UseGuards(UserJwtAuthGuard)
  @ApiOperation({
    summary: 'Read the public status history of one own collaboration request',
  })
  @ApiOkResponse({ type: CollaborationStatusHistoryDto, isArray: true })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  async collaborationHistory(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.partnershipsService.getUserCollaborationHistory(user.sub, id);
  }

  @Get('me/sponsorships')
  @ApiBearerAuth('bearerAuth')
  @UseGuards(UserJwtAuthGuard)
  @ApiOperation({
    summary: "List the authenticated user's sponsorship requests",
  })
  @ApiOkResponse({ type: SponsorshipUserResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  async listMySponsorships(@CurrentUser() user: JwtPayload) {
    return this.partnershipsService.listUserSponsorships(user.sub);
  }

  @Get('admin/collaborations')
  @ApiBearerAuth('bearerAuth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN)
  @ApiOperation({ summary: 'List collaboration requests for administrators' })
  @ApiOkResponse({ type: CollaborationAdminPageDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async listCollaborations(@Query() query: PartnershipQueryDto) {
    return this.partnershipsService.listCollaborations(query);
  }

  @Get('admin/sponsorships')
  @ApiBearerAuth('bearerAuth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.FINANCE)
  @ApiOperation({
    summary: 'List sponsorship requests for administrators and finance',
  })
  @ApiOkResponse({ type: SponsorshipAdminPageDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async listSponsorships(@Query() query: PartnershipQueryDto) {
    return this.partnershipsService.listSponsorships(query);
  }

  @Patch('admin/collaborations/:id/status')
  @ApiBearerAuth('bearerAuth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN)
  @ApiOperation({
    summary: 'Update a collaboration status and private admin note',
  })
  @ApiOkResponse({ type: CollaborationAdminResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  async updateCollabStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePartnershipStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.partnershipsService.updateCollaborationStatus(
      id,
      dto,
      user.sub,
    );
  }

  @Patch('admin/sponsorships/:id/status')
  @ApiBearerAuth('bearerAuth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.FINANCE)
  @ApiOperation({
    summary: 'Update a sponsorship status and private admin note',
  })
  @ApiOkResponse({ type: SponsorshipAdminResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  async updateSponsorStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePartnershipStatusDto,
  ) {
    return this.partnershipsService.updateSponsorshipStatus(id, dto);
  }
}
