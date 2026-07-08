import apiClient from './client';
import type {
  WalletWithTransactions,
  WalletTransaction,
  AdminWalletTransaction,
} from '../types';

const transformWalletTransaction = (transaction: any): WalletTransaction => ({
  ...transaction,
  amount: Number(transaction.amount),
  tomanValue:
    transaction.tomanValue !== undefined ? Number(transaction.tomanValue) : undefined,
  createdAt: transaction.createdAt,
});

/**
 * Get user's coin balance and history.
 */
export async function getMyWallet(): Promise<WalletWithTransactions> {
  const { data } = await apiClient.get<any>('/wallet/me');
  return {
    ...data,
    balance: Number(data.balance),
    transactions: Array.isArray(data.transactions)
      ? data.transactions.map(transformWalletTransaction)
      : [],
  };
}

/**
 * Start a Zarinpal-backed Talk Coins purchase.
 */
export async function depositFunds(amount: number): Promise<WalletTransaction> {
  const { data } = await apiClient.post<any>('/wallet/deposit', { amount });
  return transformWalletTransaction(data);
}

export async function getWalletTransactionPublic(
  transactionId: string,
  params?: { status?: 'SUCCESS' | 'FAILED'; authority?: string | null },
): Promise<WalletTransaction | null> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.authority) query.append('Authority', params.authority);

  try {
    const { data } = await apiClient.get<any>(
      `/wallet/public/transactions/${transactionId}${query.toString() ? `?${query.toString()}` : ''}`,
    );
    if (!data) return null;
    return transformWalletTransaction(data);
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw new Error(error.message || 'Failed to fetch wallet transaction.');
  }
}

export async function getAdminWalletTransactions(): Promise<
  AdminWalletTransaction[]
> {
  const { data } = await apiClient.get<any[]>('/wallet/admin/history', {
    authMode: 'admin',
  });
  return data.map((transaction) => ({
    ...transformWalletTransaction(transaction),
    user: transaction.user,
  }));
}
