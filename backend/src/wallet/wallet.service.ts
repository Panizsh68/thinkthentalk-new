import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { WalletTransactionType, PaymentStatus, WithdrawalStatus, Prisma } from '@prisma/client';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

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

  async deposit(userId: string, amount: number, description: string = 'Deposit to wallet') {
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

  async withdrawRequest(userId: string, amount: number, shabaNumber: string) {
    const wallet = await this.getWallet(userId);
    const balance = Number(wallet.balance);

    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    if (balance < amount) throw new BadRequestException('Insufficient balance');

    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });

      const request = await tx.withdrawalRequest.create({
        data: {
          userId,
          amount: new Prisma.Decimal(amount),
          shabaNumber,
          status: 'PENDING' as WithdrawalStatus,
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: new Prisma.Decimal(amount),
          type: WalletTransactionType.WITHDRAWAL,
          description: `Withdrawal request to ${shabaNumber}`,
          status: PaymentStatus.PENDING,
          referenceId: request.id,
        },
      });

      return request;
    });
  }

  async payWithWallet(userId: string, amount: number, description: string, referenceId: string) {
    const wallet = await this.getWallet(userId);
    const balance = Number(wallet.balance);

    if (balance < amount) throw new BadRequestException('Insufficient wallet balance');

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

  async listWithdrawalRequests() {
    return this.prisma.withdrawalRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: { 
        user: { select: { firstNameFa: true, lastNameFa: true, mobile: true } }
      }
    });
  }

  async updateWithdrawalStatus(id: string, status: WithdrawalStatus, adminNote?: string) {
    const request = await this.prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Request not found');

    if (status === 'REJECTED' && request.status !== 'REJECTED') {
       const wallet = await this.getWallet(request.userId);
       await this.prisma.$transaction([
         this.prisma.wallet.update({
           where: { id: wallet.id },
           data: { balance: { increment: request.amount } }
         }),
         this.prisma.withdrawalRequest.update({
           where: { id },
           data: { status, adminNote, processedAt: new Date() }
         }),
         this.prisma.walletTransaction.create({
            data: {
                walletId: wallet.id,
                amount: request.amount,
                type: WalletTransactionType.REFUND,
                description: `Refund for rejected withdrawal: ${adminNote || ''}`,
                status: PaymentStatus.SUCCESS,
                referenceId: id
            }
         })
       ]);
       return { success: true };
    }

    return this.prisma.withdrawalRequest.update({
      where: { id },
      data: { status, adminNote, processedAt: new Date() }
    });
  }
}
