import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  NotFoundException,
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
import { DiscountsService } from './discounts.service';
import { DiscountDto } from './dto/discount.dto';
import {
  DiscountFormDataDto,
  UpdateDiscountFormDataDto,
} from './dto/discount-form-data.dto';
import { AuditService } from '../infrastructure/audit/audit.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Admin')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN, AdminRole.EVENT_MANAGER, AdminRole.FINANCE)
@Controller({ path: 'admin/discounts', version: '1' })
export class AdminDiscountsController {
  constructor(
    private readonly discountsService: DiscountsService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List Discounts (Admin)',
    description: 'Retrieves a list of all discounts for the admin panel.',
  })
  @ApiOkResponse({
    description: 'A list of all discounts.',
    type: DiscountDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async listDiscounts(): Promise<DiscountDto[]> {
    return this.discountsService.listDiscounts();
  }

  @Post()
  @ApiOperation({
    summary: 'Create Discount (Admin)',
    description: 'Creates a new discount code or automatic offer.',
  })
  @ApiBody({ type: DiscountFormDataDto, required: true })
  @ApiCreatedResponse({
    description: 'Discount created successfully.',
    type: DiscountDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid discount data.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async createDiscount(
    @Body() dto: DiscountFormDataDto,
    @CurrentUser() user: { sub: string },
  ): Promise<DiscountDto> {
    const discount = await this.discountsService.createDiscount(dto);
    this.auditService.record({
      adminId: user.sub,
      action: 'CREATE_DISCOUNT',
      resourceType: 'discount',
      resourceId: discount.id,
      metadata: dto as any,
    });
    return discount;
  }

  @Patch(':discountId')
  @ApiOperation({
    summary: 'Update Discount (Admin)',
    description: 'Updates an existing discount.',
  })
  @ApiParam({ name: 'discountId', type: String, required: true })
  @ApiBody({ type: UpdateDiscountFormDataDto, required: true })
  @ApiOkResponse({
    description: 'Discount updated successfully.',
    type: DiscountDto,
  })
  @ApiNotFoundResponse({
    description: 'Discount not found.',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid discount data.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async updateDiscount(
    @Param('discountId') discountId: string,
    @Body() dto: UpdateDiscountFormDataDto,
    @CurrentUser() user: { sub: string },
  ): Promise<DiscountDto> {
    const updated = await this.discountsService.updateDiscount(discountId, dto);
    if (!updated) {
      throw new NotFoundException('Discount not found.');
    }
    this.auditService.record({
      adminId: user.sub,
      action: 'UPDATE_DISCOUNT',
      resourceType: 'discount',
      resourceId: discountId,
      metadata: dto as any,
    });
    return updated;
  }

  @Delete(':discountId')
  @ApiOperation({
    summary: 'Delete Discount (Admin)',
    description: 'Deletes a discount.',
  })
  @ApiParam({ name: 'discountId', type: String, required: true })
  @ApiNoContentResponse({ description: 'Discount deleted successfully.' })
  @ApiNotFoundResponse({
    description: 'Discount not found.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async deleteDiscount(
    @Param('discountId') discountId: string,
    @CurrentUser() user: { sub: string },
  ): Promise<void> {
    const removed = await this.discountsService.deleteDiscount(discountId);
    if (!removed) {
      throw new NotFoundException('Discount not found.');
    }
    this.auditService.record({
      adminId: user.sub,
      action: 'DELETE_DISCOUNT',
      resourceType: 'discount',
      resourceId: discountId,
    });
  }
}
