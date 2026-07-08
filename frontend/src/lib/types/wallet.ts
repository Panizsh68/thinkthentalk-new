export type WalletTransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
export type WalletTransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'PURCHASE'
  | 'REFUND';

export type WalletTransaction = {
  id: string;
  amount: number;
  tomanValue?: number;
  type: WalletTransactionType;
  description?: string;
  status: WalletTransactionStatus;
  referenceId?: string;
  redirectUrl?: string;
  createdAt: string;
};

export type Wallet = {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
};

export type WalletWithTransactions = Wallet & {
  transactions: WalletTransaction[];
};

export type AdminWalletTransaction = WalletTransaction & {
  user?: {
    id: string;
    firstNameFa?: string | null;
    lastNameFa?: string | null;
    firstNameEn?: string | null;
    lastNameEn?: string | null;
    mobile: string;
  };
};
