import apiClient from './client';
import type { Wallet, WalletTransaction, WithdrawalRequest } from '../types';

export async function getMyWallet(): Promise<Wallet & { transactions: WalletTransaction[] }> {
  const { data } = await apiClient.get<any>('/wallet/me');
  return data;
}

export async function depositFunds(amount: number): Promise<WalletTransaction> {
  const { data } = await apiClient.post<any>('/wallet/deposit', { amount });
  return data;
}

export async function requestWithdrawal(amount: number, shabaNumber: string): Promise<WithdrawalRequest> {
  const { data } = await apiClient.post<any>('/wallet/withdraw', { amount, shabaNumber });
  return data;
}

export async function getAdminWithdrawals(): Promise<WithdrawalRequest[]> {
  const { data } = await apiClient.get<any[]>('/wallet/admin/withdrawals');
  return data;
}

export async function updateWithdrawalStatus(id: string, status: string, adminNote?: string): Promise<any> {
  const { data } = await apiClient.patch<any>(`/wallet/admin/withdrawals/${id}`, { status, adminNote });
  return data;
}
