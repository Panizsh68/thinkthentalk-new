import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

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

  @Get('admin/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: 'List all coin transactions (Admin)' })
  listTransactions() {
    return this.walletService.listAllTransactions();
  }
}
