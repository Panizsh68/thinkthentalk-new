import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import {
  WalletTransactionType,
  PaymentStatus,
  Prisma,
} from '@prisma/client';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user's token balance (legacy Wallet table).
   * Renamed concepts to "Coins" for the end-user.
   */
  async getWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId, balance: 0 },
        include: { transactions: true },
      });
    }

    return wallet;
  }

  /**
   * Add coins to user's balance.
   * Coins are non-refundable tokens.
   */
  async deposit(
    userId: string,
    amount: number,
    description: string = 'Purchase of Talk Coins',
  ) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const wallet = await this.getWallet(userId);

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: new Prisma.Decimal(amount),
          type: WalletTransactionType.DEPOSIT,
          description,
          status: PaymentStatus.SUCCESS,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });

      return transaction;
    });
  }

  /**
   * Deduct coins from user's balance for services.
   */
  async payWithWallet(
    userId: string,
    amount: number,
    description: string,
    referenceId: string,
  ) {
    const wallet = await this.getWallet(userId);
    const balance = Number(wallet.balance);

    if (balance < amount)
      throw new BadRequestException('Insufficient Talk Coins balance');

    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });

      return tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: new Prisma.Decimal(amount),
          type: WalletTransactionType.PURCHASE,
          description,
          referenceId,
          status: PaymentStatus.SUCCESS,
        },
      });
    });
  }

  /**
   * Withdrawal is disabled for tokens as they are non-refundable.
   * We keep the history query but the action is removed.
   */
  async listAllTransactions() {
    return this.prisma.walletTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: {
          include: {
            user: { select: { firstNameFa: true, lastNameFa: true, mobile: true } }
          }
        },
      },
    });
  }
}
