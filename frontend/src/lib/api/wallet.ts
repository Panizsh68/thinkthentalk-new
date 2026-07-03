import apiClient from './client';
import type { Wallet, WalletTransaction } from '../types';

/**
 * Get user's coin balance and history.
 */
export async function getMyWallet(): Promise<Wallet & { transactions: WalletTransaction[] }> {
  const { data } = await apiClient.get<any>('/wallet/me');
  return data;
}

/**
 * Purchase Talk Coins.
 */
export async function depositFunds(amount: number): Promise<WalletTransaction> {
  const { data } = await apiClient.post<any>('/wallet/deposit', { amount });
  return data;
}

/**
 * Withdrawal logic removed - Talk Coins are non-refundable tokens.
 */
