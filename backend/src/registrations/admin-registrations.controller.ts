import { Body, Controller, Get, NotFoundException, Param, Patch, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBody,
} from '@nestjs/swagger';
import { RegistrationStatus } from '@prisma/client';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminRole } from '@prisma/client';
import { RegistrationsService } from './registrations.service';
import { UserRegistrationDetailsDto } from './dto/user-registration-details.dto';
import { UpdateRegistrationAdminDto } from './dto/update-registration-admin.dto';
import { AdminRegistrationsQueryDto } from './dto/admin-registrations-query.dto';
import type { Response } from 'express';
import { AuditService } from '../infrastructure/audit/audit.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Admin')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN, AdminRole.EVENT_MANAGER, AdminRole.FINANCE)
@Controller({ path: 'admin/registrations', version: '1' })
export class AdminRegistrationsController {
  constructor(
    private readonly registrationsService: RegistrationsService,
    private readonly auditService: AuditService,
  ) { }

  @Get()
  @ApiOperation({
    summary: 'List All Registrations (Admin)',
    description: 'Retrieves a detailed list of all user registrations for the admin panel.',
  })
  @ApiQuery({ name: 'eventId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: RegistrationStatus })
  @ApiOkResponse({
    description: 'A list of registrations.',
    type: UserRegistrationDetailsDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)', example: 20 })
  async listAdminRegistrations(
    @Query() query: AdminRegistrationsQueryDto,
  ): Promise<UserRegistrationDetailsDto[]> {
    const { eventId, status, page = 1, limit = 20 } = query;
    return this.registrationsService.getAdminRegistrations({ eventId, status, page, limit });
  }

  @Get(':registrationId')
  @ApiOperation({
    summary: 'Get Registration Details (Admin)',
    description: 'Retrieves full details for a single registration.',
  })
  @ApiParam({ name: 'registrationId', type: String, required: true })
  @ApiOkResponse({
    description: 'Registration details.',
    type: UserRegistrationDetailsDto,
  })
  @ApiNotFoundResponse({
    description: 'Registration not found.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async getRegistrationDetails(
    @Param('registrationId') registrationId: string,
  ): Promise<UserRegistrationDetailsDto> {
    const result = await this.registrationsService.getRegistrationDetails(registrationId);
    if (!result) {
      throw new NotFoundException('Registration not found.');
    }
    return result;
  }

  @Patch(':registrationId')
  @ApiOperation({
    summary: 'Update Registration (Admin)',
    description: "Manually updates a registration's status or the user's submitted form data.",
  })
  @ApiParam({ name: 'registrationId', type: String, required: true })
  @ApiBody({
    type: UpdateRegistrationAdminDto,
    required: false,
    description: 'Send only the fields you want to update.',
  })
  @ApiOkResponse({
    description: 'Registration updated.',
    type: UserRegistrationDetailsDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid update.', type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Registration not found.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async updateRegistration(
    @Param('registrationId') registrationId: string,
    @Body() dto: UpdateRegistrationAdminDto,
    @CurrentUser() user: { sub: string },
  ): Promise<UserRegistrationDetailsDto> {
    const result = await this.registrationsService.updateRegistration(registrationId, dto);
    if (!result) {
      throw new NotFoundException('Registration not found.');
    }
    this.auditService.record({
      adminId: user.sub,
      action: 'UPDATE_REGISTRATION',
      resourceType: 'registration',
      resourceId: registrationId,
      metadata: dto as any,
    });
    return result;
  }

  @Get('export')
  @ApiOperation({
    summary: 'Paid registrations export (Admin)',
    description: 'Generates a CSV file of paid registrations with full form data.',
  })
  @ApiQuery({ name: 'eventId', required: false, type: String })
  @ApiOkResponse({
    description: 'A CSV file of registrations.',
    content: { 'text/csv': { schema: { type: 'string' } } },
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden.', type: ErrorResponseDto })
  async exportRegistrations(
    @Query() query: AdminRegistrationsQueryDto,
    @Res() res: Response,
    @CurrentUser() user: { sub: string },
  ) {
    const { eventId } = query;
    const registrations = await this.registrationsService.exportAdminRegistrations({ eventId });

    const header = [
      'registrationId',
      'userId',
      'eventId',
      'eventTitle',
      'eventStart',
      'ticketType',
      'registrationStatus',
      'paymentStatus',
      'paymentAmount',
      'paymentId',
      'gatewayTransactionId',
      'createdAt',
      'firstNameFa',
      'lastNameFa',
      'firstNameEn',
      'lastNameEn',
      'gender',
      'age',
      'mobile',
      'email',
      'educationLevel',
      'fieldOfStudy',
      'isEmployed',
      'jobTitle',
      'languageLevel',
      'referralSource',
      'referrerName',
      'otherReferralSource',
      'acceptedRules',
    ];

    const placeholders = ['نام', 'نام خانوادگی', 'name', 'first name', 'last name'];
    const cleanString = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value).trim();
      if (!str) return '';
      const normalized = str.toLowerCase();
      return placeholders.includes(normalized) ? '' : str;
    };

    const escapeCsv = (value: any): string => {
      const str = value === null || value === undefined ? '' : String(value);
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = registrations.map((r) => {
      const form = (r.formData as any) ?? {};
      const profile = r.user ?? {};
      const pick = (formValue: any, profileValue: any) =>
        cleanString(formValue) || cleanString(profileValue);

      const eventTitle = (r.event as any)?.title?.fa ?? (r.event as any)?.title?.en ?? '';
      const rawStart = (r.event as any)?.startDateTime ?? '';
      const eventStart =
        rawStart instanceof Date
          ? rawStart.toISOString()
          : typeof rawStart === 'string'
            ? rawStart
            : '';
      const amount = r.payment?.amount ?? '';

      return [
        r.id,
        r.userId,
        r.event.id,
        eventTitle,
        eventStart,
        r.ticketType,
        r.status,
        r.payment?.status ?? '',
        amount,
        r.payment?.id ?? '',
        r.payment?.gatewayTransactionId ?? '',
        r.createdAt,
        pick(form.firstNameFa, profile.firstNameFa),
        pick(form.lastNameFa, profile.lastNameFa),
        pick(form.firstNameEn, profile.firstNameEn),
        pick(form.lastNameEn, profile.lastNameEn),
        cleanString(form.gender ?? profile.gender),
        form.age ?? profile.age ?? '',
        pick(form.mobile, profile.mobile),
        pick(form.email, profile.email),
        cleanString(form.educationLevel ?? profile.educationLevel),
        cleanString(form.fieldOfStudy ?? profile.fieldOfStudy),
        form.isEmployed ?? profile.isEmployed ?? '',
        cleanString(form.jobTitle ?? profile.jobTitle),
        cleanString(form.languageLevel ?? profile.languageLevel),
        cleanString(form.referralSource),
        cleanString(form.referrerName),
        cleanString(form.otherReferralSource),
        form.acceptedRules ?? '',
      ];
    });

    const csv = [header, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=\"registrations_paid.csv\"');
    this.auditService.record({
      adminId: user.sub,
      action: 'EXPORT_REGISTRATIONS',
      resourceType: 'registration',
      resourceId: 'bulk',
      metadata: { eventId, status: 'PAID' } as any,
    });
    return res.send(`\uFEFF${csv}`);
  }
}
