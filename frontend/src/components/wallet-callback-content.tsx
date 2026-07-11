'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, AlertTriangle, XCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useWalletTransactionPublicQuery } from '@/hooks/use-wallet-queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function WalletCallbackInner() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transactionId');
  const statusParam = searchParams.get('status') || searchParams.get('Status');
  const authority = searchParams.get('Authority');
  const normalizedStatus = statusParam
    ? statusParam.toUpperCase() === 'OK' || statusParam.toUpperCase() === 'SUCCESS'
      ? 'SUCCESS'
      : 'FAILED'
    : undefined;
  const { t } = useLanguage();
  const formatCoins = (amount: number) =>
    `${new Intl.NumberFormat(t('lng')).format(amount)} ${t('admin.currency.COIN')}`;
  const formatToman = (amount: number) =>
    `${new Intl.NumberFormat(t('lng')).format(amount)} ${t('admin.currency.TOMAN')}`;

  const { data: transaction, isLoading, error } = useWalletTransactionPublicQuery(
    transactionId,
    {
      status: normalizedStatus,
      authority,
    },
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">{t('wallet.verifying')}</p>
      </div>
    );
  }

  if (!transactionId || error || !transaction) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center text-destructive">
        <AlertTriangle className="h-12 w-12" />
        <h2 className="text-2xl font-semibold">{t('wallet.invalidRequestTitle')}</h2>
        <p className="text-muted-foreground">{t('wallet.invalidRequestDescription')}</p>
        <Button asChild>
          <Link href="/wallet">{t('wallet.backToWallet')}</Link>
        </Button>
      </div>
    );
  }

  if (transaction.status === 'SUCCESS') {
    return (
      <div className="w-full space-y-6 text-center">
        <div className="flex flex-col items-center gap-4 text-green-600">
          <CheckCircle className="h-12 w-12" />
          <h2 className="text-2xl font-semibold">{t('wallet.depositSuccess')}</h2>
          <p className="text-muted-foreground">{t('wallet.depositSuccessDescription')}</p>
        </div>
        <Card className="w-full text-left">
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <span className="text-muted-foreground">{t('payment.paymentId')}</span>
              <span className="font-mono text-sm break-all sm:text-right">{transaction.id}</span>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <span className="text-muted-foreground">{t('admin.export.amount')}</span>
              <span className="font-semibold sm:text-right">
                {formatCoins(transaction.amount)}
              </span>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <span className="text-muted-foreground">{t('wallet.gatewayCharge')}</span>
              <span className="font-semibold sm:text-right">
                {formatToman(transaction.tomanValue ?? transaction.amount * 10000)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Button asChild>
          <Link href="/wallet">{t('wallet.backToWallet')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center text-destructive">
      <XCircle className="h-12 w-12" />
      <h2 className="text-2xl font-semibold">{t('wallet.depositFailedTitle')}</h2>
      <p className="text-muted-foreground">{t('wallet.depositFailedDescription')}</p>
      <Button asChild>
        <Link href="/wallet">{t('wallet.backToWallet')}</Link>
      </Button>
    </div>
  );
}

export function WalletCallbackContent() {
  const { t } = useLanguage();

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{t('wallet.callbackTitle')}</CardTitle>
        <CardDescription>{t('wallet.callbackDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="py-12">
        <Suspense fallback={<div className="flex justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
          <WalletCallbackInner />
        </Suspense>
      </CardContent>
    </Card>
  );
}
