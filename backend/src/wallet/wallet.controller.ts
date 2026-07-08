import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Query,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '@prisma/client';
import type { Response } from 'express';

@ApiTags('Coin Center')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: 'Get current user coins balance' })
  getWallet(@CurrentUser() user: any) {
    return this.walletService.getWallet(user.sub);
  }

  @Post('deposit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: 'Purchase coins (Simulated)' })
  deposit(@CurrentUser() user: any, @Body() body: { amount: number }) {
    return this.walletService.deposit(user.sub, body.amount);
  }

  @Get('public/transactions/:transactionId')
  @ApiOperation({ summary: 'Verify a wallet top-up transaction (Public)' })
  async getPublicTransaction(
    @Param('transactionId') transactionId: string,
    @Query('Status') status?: string,
    @Query('status') statusLower?: string,
    @Query('Authority') authority?: string | null,
  ) {
    const normalizedStatus = (statusLower ?? status ?? '').toUpperCase();
    const statusValue =
      normalizedStatus === 'OK' || normalizedStatus === 'SUCCESS'
        ? 'SUCCESS'
        : normalizedStatus === 'NOK' || normalizedStatus === 'FAILED'
          ? 'FAILED'
          : undefined;

    const transaction = await this.walletService.verifyDepositPublic(
      transactionId,
      {
        status: statusValue,
        authority,
      },
    );

    if (!transaction) {
      throw new NotFoundException('Wallet transaction not found.');
    }

    return transaction;
  }

  @Get('callback')
  @ApiOperation({ summary: 'Zarinpal wallet callback (public)' })
  async handleGatewayCallback(
    @Query('transactionId') transactionId?: string,
    @Query('Authority') authority?: string,
    @Query('Status') status?: string,
    @Res() res?: Response,
  ) {
    if (!transactionId) {
      throw new NotFoundException('Wallet transaction not found.');
    }

    const normalizedStatus = status === 'OK' ? 'SUCCESS' : 'FAILED';
    const transaction = await this.walletService.verifyDepositPublic(
      transactionId,
      {
        status: normalizedStatus,
        authority,
      },
    );

    if (!transaction) {
      throw new NotFoundException('Wallet transaction not found.');
    }

    const frontendUrl = process.env.FRONTEND_URL ?? process.env.APP_URL;
    if (frontendUrl && res) {
      const receiptUrl = `${frontendUrl.replace(/\/$/, '')}/wallet/callback?transactionId=${encodeURIComponent(transaction.id)}&Status=${encodeURIComponent(status ?? '')}${
        authority ? `&Authority=${encodeURIComponent(authority)}` : ''
      }`;
      return res.redirect(receiptUrl);
    }

    return transaction;
  }

  @Get('admin/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: 'List all coin transactions (Admin)' })
  @Roles(AdminRole.ADMIN, AdminRole.FINANCE)
  listTransactions() {
    return this.walletService.listAllTransactions();
  }
}
