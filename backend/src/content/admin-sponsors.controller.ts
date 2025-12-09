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
import { SponsorsService } from './sponsors.service';
import { SponsorDto } from './dto/sponsor.dto';
import { SponsorFormDataDto, UpdateSponsorFormDataDto } from './dto/sponsor-form-data.dto';

@ApiTags('Content Management')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN, AdminRole.EVENT_MANAGER, AdminRole.FINANCE)
@Controller({ path: 'admin/sponsors', version: '1' })
export class AdminSponsorsController {
  constructor(private readonly sponsorsService: SponsorsService) { }

  @Get()
  @ApiOperation({ summary: 'List All Sponsors (Admin)', description: 'Retrieves all sponsors.' })
  @ApiOkResponse({ description: 'A list of sponsors.', type: SponsorDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async list(): Promise<SponsorDto[]> {
    return this.sponsorsService.listAdmin();
  }

  @Post()
  @ApiOperation({ summary: 'Create Sponsor (Admin)', description: 'Creates a new sponsor.' })
  @ApiBody({ type: SponsorFormDataDto, required: true })
  @ApiCreatedResponse({ description: 'Sponsor created.', type: SponsorDto })
  @ApiBadRequestResponse({ description: 'Invalid data.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async create(@Body() dto: SponsorFormDataDto): Promise<SponsorDto> {
    return this.sponsorsService.create(dto);
  }

  @Patch(':sponsorId')
  @ApiOperation({ summary: 'Update Sponsor (Admin)', description: 'Updates an existing sponsor.' })
  @ApiParam({ name: 'sponsorId', type: String, required: true })
  @ApiBody({ type: UpdateSponsorFormDataDto, required: true })
  @ApiOkResponse({ description: 'Sponsor updated.', type: SponsorDto })
  @ApiNotFoundResponse({ description: 'Sponsor not found.', type: ErrorResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid data.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async update(
    @Param('sponsorId') sponsorId: string,
    @Body() dto: UpdateSponsorFormDataDto,
  ): Promise<SponsorDto> {
    const updated = await this.sponsorsService.update(sponsorId, dto);
    if (!updated) {
      throw new NotFoundException('Sponsor not found.');
    }
    return updated;
  }

  @Delete(':sponsorId')
  @ApiOperation({ summary: 'Delete Sponsor (Admin)', description: 'Deletes a sponsor.' })
  @ApiParam({ name: 'sponsorId', type: String, required: true })
  @ApiNoContentResponse({ description: 'Sponsor deleted.' })
  @ApiNotFoundResponse({ description: 'Sponsor not found.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async delete(@Param('sponsorId') sponsorId: string): Promise<void> {
    const deleted = await this.sponsorsService.delete(sponsorId);
    if (!deleted) {
      throw new NotFoundException('Sponsor not found.');
    }
  }
}
