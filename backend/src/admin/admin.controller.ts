import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { AdminStatsService } from './admin.stats.service';
import { AdminStatsDto } from './dto/admin-stats.dto';
import { ModuleStatusDto } from '../common/dto/module-status.dto';

@ApiTags('Admin')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN, AdminRole.EVENT_MANAGER, AdminRole.FINANCE)
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly adminStatsService: AdminStatsService) { }

  @Get('stats')
  @ApiOperation({
    summary: 'Admin dashboard statistics',
    description: 'Provides high-level metrics for the admin dashboard.',
  })
  @ApiOkResponse({
    description: 'Dashboard statistics.',
    type: AdminStatsDto,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async getStats(): Promise<AdminStatsDto> {
    return this.adminStatsService.getStats();
  }

  @Get('status')
  @ApiOperation({
    summary: 'Module status',
    description: 'Health/status check for the admin subsystem.',
  })
  @ApiOkResponse({ description: 'Admin status.', type: ModuleStatusDto })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async status(): Promise<ModuleStatusDto> {
    return { status: 'ok', module: 'admin', timestamp: new Date().toISOString() };
  }
}
