import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { RegistrationsService } from './registrations.service';
import { UserRegistrationDto } from './dto/user-registration.dto';

@ApiTags('Registrations')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'registrations', version: '1' })
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) { }

  @Get('me')
  @ApiOperation({
    summary: 'Get My Registrations',
    description: 'Returns a list of all registrations for the currently authenticated user.',
  })
  @ApiOkResponse({
    description: "A list of user's registrations.",
    type: UserRegistrationDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  async getMyRegistrations(
    @CurrentUser() user: { sub: string },
  ): Promise<UserRegistrationDto[]> {
    return this.registrationsService.getMyRegistrations(user.sub);
  }
}
