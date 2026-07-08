'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/lib/i18n/language-provider';
import { getMyWallet, depositFunds } from '@/lib/api/wallet';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowRight,
  Coins,
  History,
  Loader2,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns-jalali';
import { cn } from '@/lib/utils';
import type { WalletWithTransactions } from '@/lib/types';

const TOMAN_PER_COIN = 10000;
const QUICK_PACKAGES = [10, 25, 50, 100];

export default function WalletPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletWithTransactions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('10');
  const [actionLoading, setActionLoading] = useState(false);
  const isRTL = language === 'fa';

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const data = await getMyWallet();
      setWallet(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const coinAmount = Math.max(0, Number(depositAmount) || 0);
  const tomanAmount = coinAmount * TOMAN_PER_COIN;

  const summary = useMemo(() => {
    const transactions = wallet?.transactions ?? [];
    return transactions.reduce(
      (acc, tx) => {
        if (tx.type === 'DEPOSIT' && tx.status === 'SUCCESS') acc.purchased += tx.amount;
        if (tx.type === 'PURCHASE' && tx.status === 'SUCCESS') acc.spent += tx.amount;
        if (tx.status === 'PENDING') acc.pending += 1;
        return acc;
      },
      { purchased: 0, spent: 0, pending: 0 },
    );
  }, [wallet]);

  const handleDeposit = async () => {
    if (!coinAmount || coinAmount < 1) {
      toast({ variant: 'destructive', title: t('wallet.minDepositError') });
      return;
    }

    setActionLoading(true);
    try {
      const transaction = await depositFunds(coinAmount);
      setDepositAmount('10');

      if (transaction.redirectUrl) {
        window.location.href = transaction.redirectUrl;
        return;
      }

      toast({ title: t('wallet.depositPending') });
      fetchWallet();
    } catch (err: any) {
      toast({ variant: 'destructive', title: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl space-y-8 py-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-cyan-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(103,232,249,0.28),_transparent_35%),linear-gradient(135deg,#020617_0%,#071226_55%,#0f172a_100%)] p-6 text-white shadow-2xl md:p-8">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.18),_transparent_70%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-6">
            <div className={cn('flex items-start gap-4', isRTL && 'flex-row-reverse text-right')}>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                <WalletCards className="h-8 w-8 text-cyan-300" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-200">
                  {t('wallet.heroEyebrow')}
                </p>
                <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                  {t('wallet.title')}
                </h1>
                <p className="max-w-2xl text-sm text-slate-300 md:text-base">
                  {t('wallet.heroDescription')}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard
                label={t('wallet.balance')}
                value={`${Number(wallet?.balance || 0).toLocaleString()} ${t('admin.currency.COIN')}`}
              />
              <MetricCard
                label={t('wallet.coinValueLabel')}
                value={`${new Intl.NumberFormat(t('lng')).format(TOMAN_PER_COIN)} ${t('admin.currency.TOMAN')}`}
              />
              <MetricCard
                label={t('wallet.pendingTopups')}
                value={summary.pending}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <HowItWorksCard
                icon={Coins}
                title={t('wallet.steps.buyTitle')}
                description={t('wallet.steps.buyDescription')}
              />
              <HowItWorksCard
                icon={ArrowRight}
                title={t('wallet.steps.useTitle')}
                description={t('wallet.steps.useDescription')}
              />
              <HowItWorksCard
                icon={ShieldCheck}
                title={t('wallet.steps.noteTitle')}
                description={t('wallet.steps.noteDescription')}
              />
            </div>
          </div>

          <Card className="rounded-[1.75rem] border border-white/10 bg-white/5 text-white backdrop-blur">
            <CardHeader className={cn(isRTL && 'text-right')}>
              <CardTitle className="text-xl font-black">{t('wallet.depositTitle')}</CardTitle>
              <CardDescription className="text-slate-300">
                {t('wallet.depositHelper')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {QUICK_PACKAGES.map((pkg) => (
                  <Button
                    key={pkg}
                    type="button"
                    variant={Number(depositAmount) === pkg ? 'secondary' : 'outline'}
                    className={cn(
                      'h-14 rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10',
                      Number(depositAmount) === pkg && 'bg-white text-slate-950',
                    )}
                    onClick={() => setDepositAmount(String(pkg))}
                  >
                    {pkg} {t('admin.currency.COIN')}
                  </Button>
                ))}
              </div>

              <div className="space-y-3">
                <Label className="font-bold">{t('wallet.coinInputLabel')}</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="h-14 rounded-2xl border-white/10 bg-slate-950/40 text-lg font-black text-white"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{t('wallet.receivedCoins')}</span>
                  <span className="font-black">
                    {coinAmount.toLocaleString()} {t('admin.currency.COIN')}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-300">{t('wallet.gatewayCharge')}</span>
                  <span className="font-black">
                    {new Intl.NumberFormat(t('lng')).format(tomanAmount)} {t('admin.currency.TOMAN')}
                  </span>
                </div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="h-14 w-full rounded-2xl bg-cyan-300 font-black text-slate-950 hover:bg-cyan-200">
                    {t('wallet.payAndCharge')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2rem]">
                  <DialogHeader className={cn(isRTL && 'text-right')}>
                    <DialogTitle>{t('wallet.confirmTitle')}</DialogTitle>
                    <DialogDescription>{t('wallet.confirmDescription')}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-2 text-sm">
                    <Row label={t('wallet.receivedCoins')} value={`${coinAmount.toLocaleString()} ${t('admin.currency.COIN')}`} />
                    <Row label={t('wallet.gatewayCharge')} value={`${new Intl.NumberFormat(t('lng')).format(tomanAmount)} ${t('admin.currency.TOMAN')}`} />
                    <p className="rounded-xl bg-muted p-3 text-muted-foreground">
                      {t('wallet.nonRefundableNote')}
                    </p>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleDeposit}
                      disabled={actionLoading}
                      className="h-12 w-full rounded-2xl font-black"
                    >
                      {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('wallet.confirmAndContinue')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
            <CardFooter className="text-xs text-slate-300">
              {t('wallet.nonRefundableNote')}
            </CardFooter>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-[1.75rem] border-border/40">
          <CardHeader>
            <CardTitle className="text-lg font-black">{t('wallet.overviewTitle')}</CardTitle>
            <CardDescription>{t('wallet.overviewDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              label={t('wallet.balance')}
              value={`${Number(wallet?.balance || 0).toLocaleString()} ${t('admin.currency.COIN')}`}
            />
            <InfoRow
              label={t('wallet.totalPurchased')}
              value={`${summary.purchased.toLocaleString()} ${t('admin.currency.COIN')}`}
            />
            <InfoRow
              label={t('wallet.totalSpent')}
              value={`${summary.spent.toLocaleString()} ${t('admin.currency.COIN')}`}
            />
            <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              {t('wallet.guidance')}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border/40">
          <CardHeader className="border-b border-border/40">
            <CardTitle className={cn('flex items-center gap-2 text-lg font-black', isRTL && 'flex-row-reverse')}>
              <History className="h-5 w-5 text-primary" />
              {t('wallet.history')}
            </CardTitle>
            <CardDescription>{t('wallet.historyDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.export.status')}</TableHead>
                    <TableHead>{t('admin.export.amount')}</TableHead>
                    <TableHead>{t('wallet.gatewayCharge')}</TableHead>
                    <TableHead>{t('admin.export.date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wallet?.transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-20 text-center text-muted-foreground">
                        {t('wallet.noTransactions')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    wallet?.transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Badge
                            variant={
                              tx.status === 'FAILED'
                                ? 'destructive'
                                : tx.status === 'PENDING'
                                  ? 'secondary'
                                  : tx.type === 'DEPOSIT' || tx.type === 'REFUND'
                                    ? 'default'
                                    : 'outline'
                            }
                          >
                            {t(`wallet.txType.${tx.type}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">
                          {(tx.type === 'DEPOSIT' || tx.type === 'REFUND' ? '+' : '-')}
                          {Number(tx.amount).toLocaleString()} {t('admin.currency.COIN')}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {tx.tomanValue
                            ? `${new Intl.NumberFormat(t('lng')).format(tx.tomanValue)} ${t('admin.currency.TOMAN')}`
                            : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(tx.createdAt), 'yyyy/MM/dd HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-300">{label}</div>
      <div className="mt-3 text-2xl font-black">{value}</div>
    </div>
  );
}

function HowItWorksCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <Icon className="h-5 w-5 text-cyan-300" />
      <div className="mt-3 text-sm font-black">{title}</div>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border bg-background/70 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-black">{value}</span>
    </div>
  );
}
