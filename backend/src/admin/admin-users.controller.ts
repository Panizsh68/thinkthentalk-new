import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { AdminUsersService } from './admin-users.service';
import {
  AdminUserDetailsDto,
  AdminUserListItemDto,
} from './dto/admin-user.dto';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';

@ApiTags('Admin')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN, AdminRole.EVENT_MANAGER, AdminRole.FINANCE)
@Controller({ path: 'admin/users', version: '1' })
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({
    summary: 'List users (OTP sign-in)',
    description:
      'Lists users who have signed in with mobile/OTP and shows profile completeness.',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'profileStatus',
    required: false,
    enum: ['complete', 'incomplete'],
    description: 'Filter by profile completeness.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiOkResponse({
    description: 'List of users.',
    type: AdminUserListItemDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async listUsers(
    @Query() query: AdminUsersQueryDto,
  ): Promise<AdminUserListItemDto[]> {
    return this.adminUsersService.listUsers(query);
  }

  @Get(':userId')
  @ApiOperation({
    summary: 'User details (Admin)',
    description:
      'Returns full profile details and registrations for a specific user.',
  })
  @ApiParam({ name: 'userId', required: true, type: String })
  @ApiOkResponse({ description: 'User details.', type: AdminUserDetailsDto })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async getUser(@Param('userId') userId: string): Promise<AdminUserDetailsDto> {
    const details = await this.adminUsersService.getUserDetails(userId);
    if (!details) {
      throw new NotFoundException('User not found.');
    }
    return details;
  }
}
