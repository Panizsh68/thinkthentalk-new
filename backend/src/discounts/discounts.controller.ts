import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { DiscountsService } from './discounts.service';
import { ValidateDiscountDto } from './dto/validate-discount.dto';
import { DiscountDto } from './dto/discount.dto';
import { ModuleStatusDto } from '../common/dto/module-status.dto';
import { Query } from '@nestjs/common';

@ApiTags('Discounts')
@Controller({ path: 'discounts', version: '1' })
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) { }

  @Get('status')
  @ApiOperation({ summary: 'Module status', description: 'Health/status check for the discounts subsystem.' })
  @ApiOkResponse({ description: 'Discounts status.', type: ModuleStatusDto })
  status(): ModuleStatusDto {
    return this.discountsService.status();
  }

  @Get('public')
  @ApiOperation({
    summary: 'List public discounts',
    description: 'Returns active public discounts, optionally filtered by eventId.',
  })
  @ApiOkResponse({ description: 'Public discounts list.', type: [DiscountDto] })
  async listPublic(
    @Query('eventId') eventId?: string,
  ): Promise<DiscountDto[]> {
    return this.discountsService.listPublicDiscounts(eventId);
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({
    summary: 'Validate a Discount Code',
    description: 'Checks if a discount code is valid for a given event and price.',
  })
  @ApiBody({ type: ValidateDiscountDto, required: true })
  @ApiOkResponse({ description: 'Discount code is valid.', type: DiscountDto })
  @ApiBadRequestResponse({
    description: 'Discount is not valid for one or more reasons.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  async validate(
    @CurrentUser() user: { sub: string },
    @Body() dto: ValidateDiscountDto,
  ): Promise<DiscountDto> {
    return this.discountsService.validateDiscount(user.sub, dto);
  }
}
