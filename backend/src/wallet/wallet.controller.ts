import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Patch,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole, WithdrawalStatus } from '@prisma/client';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: 'Get current user wallet' })
  getWallet(@CurrentUser() user: any) {
    return this.walletService.getWallet(user.sub);
  }

  @Post('deposit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: 'Deposit funds (Simulated)' })
  deposit(@CurrentUser() user: any, @Body() body: { amount: number }) {
    return this.walletService.deposit(user.sub, body.amount);
  }

  @Post('withdraw')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: 'Request withdrawal' })
  withdraw(
    @CurrentUser() user: any,
    @Body() body: { amount: number; shabaNumber: string },
  ) {
    return this.walletService.withdrawRequest(
      user.sub,
      body.amount,
      body.shabaNumber,
    );
  }

  @Get('admin/withdrawals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.FINANCE)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: 'List withdrawal requests (Admin)' })
  listWithdrawals() {
    return this.walletService.listWithdrawalRequests();
  }

  @Patch('admin/withdrawals/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.FINANCE)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: 'Update withdrawal status (Admin)' })
  updateWithdrawal(
    @Param('id') id: string,
    @Body() body: { status: WithdrawalStatus; adminNote?: string },
  ) {
    return this.walletService.updateWithdrawalStatus(
      id,
      body.status,
      body.adminNote,
    );
  }
}
