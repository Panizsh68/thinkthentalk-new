import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { UsersService } from './users.service';
import { UserDto } from './dto/user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@ApiTags('Users')
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: 'Get My Profile' })
  @ApiOkResponse({ description: 'User profile data.', type: UserDto })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated.',
    type: ErrorResponseDto,
  })
  async getMe(@CurrentUser() user: { sub: string }): Promise<UserDto> {
    return this.usersService.getMe(user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: 'Update My Profile' })
  @ApiOkResponse({
    description: 'Profile updated successfully.',
    type: UserDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data provided.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated.',
    type: ErrorResponseDto,
  })
  async updateMe(
    @CurrentUser() user: { sub: string },
    @Body() body: UpdateUserProfileDto,
  ): Promise<UserDto> {
    return this.usersService.updateProfile(user.sub, body);
  }
}
