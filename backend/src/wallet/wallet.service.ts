import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { WalletTransactionType, PaymentStatus, Prisma } from '@prisma/client';
import { ZarinpalGateway } from '../payments/providers/zarinpal.gateway';

type PrismaTx = Prisma.TransactionClient;

const MIN_TOPUP_COINS = 1;
const TOMAN_PER_COIN = 10000;

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly zarinpalGateway: ZarinpalGateway,
  ) {}

  async getWallet(userId: string) {
    const wallet = await this.ensureWallet(userId);

    return {
      id: wallet.id,
      userId: wallet.userId,
      balance: Number(wallet.balance),
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
      transactions: wallet.transactions.map((transaction) =>
        this.toWalletTransactionDto(transaction),
      ),
    };
  }

  async getWalletBalance(userId: string): Promise<number> {
    const wallet = await this.ensureWallet(userId);
    return Number(wallet.balance);
  }

  async initiateDeposit(
    userId: string,
    amount: number,
    description = 'Talk Coins top-up',
  ) {
    const coinAmount = Math.round(amount);

    if (!Number.isFinite(coinAmount) || coinAmount < MIN_TOPUP_COINS) {
      throw new BadRequestException(
        `Minimum top-up amount is ${MIN_TOPUP_COINS} Talk Coin.`,
      );
    }

    const wallet = await this.ensureWallet(userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, mobile: true },
    });

    const callbackUrl = this.buildGatewayCallbackUrl();
    const requestResult = await this.zarinpalGateway.requestPayment({
      amount: this.coinsToToman(coinAmount),
      currency: 'TOMAN',
      description,
      callbackUrl,
      metadata: {
        email: user?.email,
        mobile: user?.mobile,
      },
    });

    const transaction = await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: new Prisma.Decimal(coinAmount),
        type: WalletTransactionType.DEPOSIT,
        description,
        status: PaymentStatus.PENDING,
        referenceId: requestResult.authority,
      },
    });

    return {
      ...this.toWalletTransactionDto(transaction),
      redirectUrl: requestResult.url,
    };
  }

  async verifyDepositPublic(
    transactionId: string,
    dto: { status?: 'SUCCESS' | 'FAILED'; authority?: string | null },
  ) {
    const transaction = await this.prisma.walletTransaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true },
    });

    if (!transaction || transaction.type !== WalletTransactionType.DEPOSIT) {
      return null;
    }

    if (dto.status === 'FAILED') {
      const failedTransaction =
        transaction.status === PaymentStatus.PENDING
          ? await this.prisma.walletTransaction.update({
              where: { id: transaction.id },
              data: { status: PaymentStatus.FAILED },
            })
          : transaction;

      return this.toWalletTransactionDto(failedTransaction);
    }

    if (transaction.status === PaymentStatus.SUCCESS) {
      return this.toWalletTransactionDto(transaction);
    }

    const coinAmount = Number(transaction.amount);
    const verification = await this.zarinpalGateway.verifyPayment({
      authority: dto.authority ?? transaction.referenceId ?? transaction.id,
      amount: this.coinsToToman(coinAmount),
    });

    if (!verification.success) {
      const failedTransaction =
        transaction.status === PaymentStatus.PENDING
          ? await this.prisma.walletTransaction.update({
              where: { id: transaction.id },
              data: { status: PaymentStatus.FAILED },
            })
          : transaction;

      return this.toWalletTransactionDto(failedTransaction);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await tx.walletTransaction.findUnique({
        where: { id: transaction.id },
      });

      if (!current) {
        throw new NotFoundException('Wallet transaction not found');
      }

      if (current.status === PaymentStatus.SUCCESS) {
        return current;
      }

      await tx.wallet.update({
        where: { id: transaction.walletId },
        data: { balance: { increment: coinAmount } },
      });

      return tx.walletTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentStatus.SUCCESS,
          referenceId: verification.referenceId ?? current.referenceId,
        },
      });
    });

    return this.toWalletTransactionDto(updated);
  }

  async deposit(
    userId: string,
    amount: number,
    description: string = 'Purchase of Talk Coins',
  ) {
    return this.initiateDeposit(userId, amount, description);
  }

  async payWithWallet(
    userId: string,
    amount: number,
    description: string,
    referenceId: string,
  ) {
    return this.prisma.$transaction(async (tx) =>
      this.payWithWalletInTransaction(
        tx,
        userId,
        amount,
        description,
        referenceId,
      ),
    );
  }

  async payWithWalletInTransaction(
    tx: PrismaTx,
    userId: string,
    amount: number,
    description: string,
    referenceId: string,
  ) {
    const wallet = await this.ensureWallet(userId, tx);
    const balance = Number(wallet.balance);

    if (balance < amount) {
      throw new BadRequestException(
        'Insufficient Talk Coins balance. Please charge your wallet first.',
      );
    }

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
  }

  async listAllTransactions() {
    const transactions = await this.prisma.walletTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                firstNameFa: true,
                lastNameFa: true,
                firstNameEn: true,
                lastNameEn: true,
                mobile: true,
              },
            },
          },
        },
      },
    });

    return transactions.map((transaction) => ({
      ...this.toWalletTransactionDto(transaction),
      user: transaction.wallet.user
        ? {
            id: transaction.wallet.user.id,
            firstNameFa: transaction.wallet.user.firstNameFa,
            lastNameFa: transaction.wallet.user.lastNameFa,
            firstNameEn: transaction.wallet.user.firstNameEn,
            lastNameEn: transaction.wallet.user.lastNameEn,
            mobile: transaction.wallet.user.mobile,
          }
        : undefined,
    }));
  }

  private async ensureWallet(userId: string, tx?: PrismaTx) {
    const db = tx ?? this.prisma;
    let wallet = await db.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!wallet) {
      wallet = await db.wallet.create({
        data: { userId, balance: 0 },
        include: { transactions: true },
      });
    }

    return wallet;
  }

  private buildGatewayCallbackUrl() {
    const callbackBase = this.configService.get<string>(
      'ZARINPAL_CALLBACK_URL',
    );

    if (!callbackBase) {
      throw new BadRequestException('Payment gateway callback URL is missing');
    }

    let url: URL;
    try {
      url = new URL(callbackBase);
    } catch {
      throw new BadRequestException('Payment gateway callback URL is invalid');
    }

    if (url.pathname.endsWith('/payments/callback')) {
      url.pathname = url.pathname.replace(
        /\/payments\/callback$/,
        '/wallet/callback',
      );
    } else {
      url.pathname = '/api/wallet/callback';
    }

    return url.toString();
  }

  private toWalletTransactionDto(transaction: {
    id: string;
    amount: Prisma.Decimal | number;
    type: WalletTransactionType;
    description: string | null;
    status: PaymentStatus;
    referenceId: string | null;
    createdAt: Date;
  }) {
    return {
      id: transaction.id,
      amount:
        typeof transaction.amount === 'number'
          ? transaction.amount
          : transaction.amount.toNumber(),
      tomanValue:
        (typeof transaction.amount === 'number'
          ? transaction.amount
          : transaction.amount.toNumber()) * TOMAN_PER_COIN,
      type: transaction.type,
      description: transaction.description ?? undefined,
      status: transaction.status,
      referenceId: transaction.referenceId ?? undefined,
      createdAt: transaction.createdAt,
    };
  }

  coinsToToman(coins: number): number {
    return Math.round(coins * TOMAN_PER_COIN);
  }

  tomanToCoins(amountToman: number): number {
    return Math.max(0, Math.ceil(amountToman / TOMAN_PER_COIN));
  }
}
