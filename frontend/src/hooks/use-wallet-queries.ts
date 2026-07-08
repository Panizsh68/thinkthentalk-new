'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getAdminWalletTransactions,
  getMyWallet,
  getWalletTransactionPublic,
} from '@/lib/api/wallet';

export const walletKeys = {
  all: ['wallet'] as const,
  me: () => [...walletKeys.all, 'me'] as const,
  adminHistory: () => [...walletKeys.all, 'admin-history'] as const,
  publicTransaction: (
    transactionId: string,
    status?: string,
    authority?: string | null,
  ) =>
    [
      ...walletKeys.all,
      'public-transaction',
      transactionId,
      status ?? null,
      authority ?? null,
    ] as const,
};

export function useMyWalletQuery() {
  return useQuery({
    queryKey: walletKeys.me(),
    queryFn: getMyWallet,
  });
}

export function useAdminWalletTransactionsQuery() {
  return useQuery({
    queryKey: walletKeys.adminHistory(),
    queryFn: getAdminWalletTransactions,
  });
}

export function useWalletTransactionPublicQuery(
  transactionId: string | null,
  params?: { status?: 'SUCCESS' | 'FAILED'; authority?: string | null },
) {
  return useQuery({
    queryKey: walletKeys.publicTransaction(
      transactionId || '',
      params?.status,
      params?.authority ?? null,
    ),
    queryFn: () => getWalletTransactionPublic(transactionId!, params),
    enabled: !!transactionId,
  });
}
