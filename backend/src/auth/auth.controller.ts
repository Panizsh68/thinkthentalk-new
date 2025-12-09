import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AdminUserDto } from '../admin/dto/admin-user.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminAuthResponseDto } from './dto/admin-auth-response.dto';
import { AuthTokenResponseDto } from './dto/auth-token-response.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { RequestOtpResponseDto } from './dto/request-otp-response.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UserDto } from '../users/dto/user.dto';
import { ModuleStatusDto } from '../common/dto/module-status.dto';
import type { Response } from 'express';

@ApiTags('Auth')
@Controller({ path: 'auth' })
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get('status')
  @ApiOperation({ summary: 'Module status', description: 'Health/status check for the auth subsystem.' })
  @ApiOkResponse({ description: 'Auth status.', type: ModuleStatusDto })
  status(): ModuleStatusDto {
    return this.authService.status();
  }

  @Post('request-otp')
  @ApiOperation({ summary: 'Request OTP for login' })
  @ApiOkResponse({
    description: 'OTP sent successfully.',
    type: RequestOtpResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid mobile number format.',
    type: ErrorResponseDto,
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests.',
    type: ErrorResponseDto,
  })
  @ApiBody({ type: RequestOtpDto, required: true })
  async requestOtp(@Body() body: RequestOtpDto, @Req() req: Request): Promise<{ success: boolean }> {
    const clientIp =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown';

    await this.authService.requestOtp(body.mobile, clientIp);
    return { success: true };
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and obtain JWT' })
  @ApiOkResponse({
    description: 'Login successful.',
    type: AuthTokenResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid OTP.',
    type: ErrorResponseDto,
  })
  @ApiTooManyRequestsResponse({ description: 'Too many requests.', type: ErrorResponseDto })
  @ApiBody({ type: VerifyOtpDto, required: true })
  async verifyOtp(
    @Body() body: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: UserDto }> {
    const result = await this.authService.verifyOtpAndLogin(body.mobile, body.otp);
    res.setHeader('Authorization', `Bearer ${result.token}`);
    return { user: result.user as any };
  }

  @Post('admin/login')
  @ApiOperation({ summary: 'Admin login' })
  @ApiOkResponse({
    description: 'Admin login successful.',
    type: AdminAuthResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.', type: ErrorResponseDto })
  @ApiTooManyRequestsResponse({ description: 'Too many requests.', type: ErrorResponseDto })
  @ApiBody({ type: AdminLoginDto, required: true })
  async adminLogin(
    @Body() body: AdminLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: AdminUserDto }> {
    const clientIp =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown';
    const result = await this.authService.loginAdmin(body.email, body.password, clientIp);
    res.setHeader('Authorization', `Bearer ${result.token}`);
    return { user: result.user as any };
  }
}
