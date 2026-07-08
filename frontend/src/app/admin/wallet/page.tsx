'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { Coins, Download, Loader2, ShieldCheck, TrendingUp, WalletCards } from 'lucide-react';
import { withRoleGuard } from '@/components/admin/with-role-guard';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useAdminWalletTransactionsQuery } from '@/hooks/use-wallet-queries';
import { exportToCsv } from '@/lib/csv-export';
import { getFormattedDateTime } from '@/lib/event-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TOMAN_PER_COIN = 10000;

const getStatusVariant = (status: 'SUCCESS' | 'PENDING' | 'FAILED') => {
  switch (status) {
    case 'SUCCESS':
      return 'default';
    case 'PENDING':
      return 'secondary';
    case 'FAILED':
      return 'destructive';
    default:
      return 'outline';
  }
};

function AdminWalletPage() {
  const { t, language } = useLanguage();
  const { data: transactions, isLoading, error } = useAdminWalletTransactionsQuery();
  const formatCoins = (amount: number) =>
    `${new Intl.NumberFormat(t('lng')).format(amount)} ${t('admin.currency.COIN')}`;
  const formatToman = (amount: number) =>
    `${new Intl.NumberFormat(t('lng')).format(amount)} ${t('admin.currency.TOMAN')}`;

  const summary = useMemo(() => {
    if (!transactions) {
      return { soldCoins: 0, spentCoins: 0, pending: 0, revenueToman: 0 };
    }

    return transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'DEPOSIT' && transaction.status === 'SUCCESS') {
          acc.soldCoins += transaction.amount;
          acc.revenueToman += transaction.tomanValue ?? transaction.amount * TOMAN_PER_COIN;
        }
        if (transaction.type === 'PURCHASE' && transaction.status === 'SUCCESS') {
          acc.spentCoins += transaction.amount;
        }
        if (transaction.status === 'PENDING') {
          acc.pending += 1;
        }
        return acc;
      },
      { soldCoins: 0, spentCoins: 0, pending: 0, revenueToman: 0 },
    );
  }, [transactions]);

  const handleExport = () => {
    if (!transactions?.length) return;

    exportToCsv(
      transactions.map((transaction) => ({
        id: transaction.id,
        user: transaction.user
          ? [
              transaction.user.firstNameFa,
              transaction.user.lastNameFa,
              transaction.user.firstNameEn,
              transaction.user.lastNameEn,
            ]
              .filter(Boolean)
              .join(' ')
              .trim() || transaction.user.mobile
          : '',
        mobile: transaction.user?.mobile ?? '',
        type: t(`wallet.txType.${transaction.type}`),
        status: t(`admin.payments.status.${transaction.status.toLowerCase()}`),
        coins: transaction.amount,
        tomanValue: transaction.tomanValue ?? transaction.amount * TOMAN_PER_COIN,
        referenceId: transaction.referenceId ?? '',
        date: format(new Date(transaction.createdAt), 'yyyy-MM-dd HH:mm'),
      })),
      {
        id: t('payment.paymentId'),
        user: t('admin.payments.table.user'),
        mobile: t('admin.export.mobile'),
        type: t('admin.wallet.table.type'),
        status: t('admin.export.status'),
        coins: t('admin.wallet.table.coins'),
        tomanValue: t('admin.wallet.table.tomanValue'),
        referenceId: t('admin.wallet.table.referenceId'),
        date: t('admin.export.date'),
      },
      `wallet-transactions_${new Date().toISOString().slice(0, 10)}.csv`,
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="py-12 text-center text-destructive">{t('wallet.invalidRequestDescription')}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border bg-[linear-gradient(135deg,#082f49_0%,#0f172a_55%,#111827_100%)] p-6 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <WalletCards className="h-7 w-7 text-cyan-300" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">
                {t('admin.wallet.eyebrow')}
              </p>
            </div>
            <h1 className="text-3xl font-black">{t('admin.wallet.title')}</h1>
            <p className="max-w-2xl text-sm text-slate-300">{t('admin.wallet.subtitle')}</p>
          </div>

          <Button onClick={handleExport} disabled={!transactions?.length} className="bg-white text-slate-950 hover:bg-slate-100">
            <Download className="mr-2 h-4 w-4" />
            {t('admin.export.exportCsv')}
          </Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Coins}
          title={t('admin.wallet.totalSold')}
          value={formatCoins(summary.soldCoins)}
          description={formatToman(summary.revenueToman)}
        />
        <StatCard
          icon={TrendingUp}
          title={t('admin.wallet.totalSpent')}
          value={formatCoins(summary.spentCoins)}
          description={t('admin.wallet.spentDescription')}
        />
        <StatCard
          icon={ShieldCheck}
          title={t('admin.wallet.pendingTopups')}
          value={summary.pending}
          description={t('admin.wallet.pendingDescription')}
        />
        <StatCard
          icon={WalletCards}
          title={t('admin.wallet.coinRate')}
          value={formatToman(TOMAN_PER_COIN)}
          description={t('admin.wallet.coinRateDescription')}
        />
      </div>

      <Card className="rounded-[1.75rem] border-border/40">
        <CardHeader>
          <CardTitle>{t('admin.wallet.table.title')}</CardTitle>
          <CardDescription>{t('admin.wallet.table.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.payments.table.user')}</TableHead>
                  <TableHead>{t('admin.wallet.table.type')}</TableHead>
                  <TableHead>{t('admin.wallet.table.coins')}</TableHead>
                  <TableHead>{t('admin.wallet.table.tomanValue')}</TableHead>
                  <TableHead>{t('admin.export.status')}</TableHead>
                  <TableHead>{t('admin.wallet.table.referenceId')}</TableHead>
                  <TableHead>{t('admin.export.date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.length ? (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="font-medium">
                          {transaction.user
                            ? [
                                transaction.user.firstNameFa,
                                transaction.user.lastNameFa,
                                transaction.user.firstNameEn,
                                transaction.user.lastNameEn,
                              ]
                                .filter(Boolean)
                                .join(' ')
                                .trim() || transaction.user.mobile
                            : '—'}
                        </div>
                        <div className="text-xs text-muted-foreground">{transaction.user?.mobile ?? '—'}</div>
                      </TableCell>
                      <TableCell>{t(`wallet.txType.${transaction.type}`)}</TableCell>
                      <TableCell className="font-semibold">{formatCoins(transaction.amount)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatToman(transaction.tomanValue ?? transaction.amount * TOMAN_PER_COIN)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(transaction.status)}>
                          {t(`admin.payments.status.${transaction.status.toLowerCase()}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{transaction.referenceId ?? '—'}</TableCell>
                      <TableCell>{getFormattedDateTime(new Date(transaction.createdAt), language)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      {t('admin.wallet.empty')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  description,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  description: string;
}) {
  return (
    <Card className="rounded-[1.5rem] border-border/40">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{title}</div>
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="mt-3 text-2xl font-black">{value}</div>
        <div className="mt-2 text-xs text-muted-foreground">{description}</div>
      </CardContent>
    </Card>
  );
}

export default withRoleGuard(AdminWalletPage, ['ADMIN', 'FINANCE']);
