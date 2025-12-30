import { Body, Controller, Post, Req } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { ContactSuccessResponseDto } from './dto/contact-success-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('Contact')
@Controller({ path: 'contact', version: '1' })
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  private detectLanguage(header?: string, fallback?: string): string {
    const explicit = fallback?.toLowerCase();
    if (explicit) {
      return explicit.startsWith('fa') ? 'fa' : 'en';
    }

    if (!header) {
      return 'en';
    }

    const primary = header.split(',')[0]?.trim().toLowerCase();
    if (primary?.startsWith('fa')) {
      return 'fa';
    }
    return 'en';
  }

  private buildSuccessMessage(language: string): string {
    return language === 'fa'
      ? 'پیام شما با موفقیت ارسال شد. به زودی با شما تماس می‌گیریم.'
      : "Your message has been sent. We'll get back to you soon.";
  }

  @Post()
  @ApiOperation({ summary: 'Send a contact message' })
  @ApiBody({ type: CreateContactMessageDto })
  @ApiOkResponse({
    description: 'Message accepted.',
    type: ContactSuccessResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error.',
    type: ErrorResponseDto,
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded.',
    type: ErrorResponseDto,
  })
  async submitContactMessage(
    @Body() body: CreateContactMessageDto,
    @Req() req: Request,
  ): Promise<ContactSuccessResponseDto> {
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown';
    const language = this.detectLanguage(
      req.headers['accept-language'],
      body.language,
    );

    await this.contactService.submitPublicMessage(body, {
      ip,
      userAgent: req.headers['user-agent'],
      language,
      honeypotValue: body.honeypot ?? body.website,
    });

    return {
      success: true,
      message: this.buildSuccessMessage(language),
    };
  }
}
