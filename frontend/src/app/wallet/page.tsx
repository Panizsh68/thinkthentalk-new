'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useAuth } from '@/lib/auth/auth-provider';
import { getMyWallet, depositFunds, requestWithdrawal } from '@/lib/api/wallet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Wallet, ArrowUpCircle, ArrowDownCircle, History, Loader2, Landmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFormattedPrice } from '@/lib/event-helpers';
import { format } from 'date-fns-jalali';

export default function WalletPage() {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [shaba, setShaba] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleDeposit = async () => {
    const amount = Number(depositAmount);
    if (!amount || amount < 1000) {
      toast({ variant: 'destructive', title: t('wallet.minDepositError') });
      return;
    }
    setActionLoading(true);
    try {
      await depositFunds(amount);
      toast({ title: t('wallet.depositSuccess') });
      setDepositAmount('');
      fetchWallet();
    } catch (err: any) {
      toast({ variant: 'destructive', title: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount < 10000) {
      toast({ variant: 'destructive', title: t('wallet.minWithdrawError') });
      return;
    }
    if (!shaba.startsWith('IR') || shaba.length !== 26) {
        toast({ variant: 'destructive', title: t('wallet.shabaInvalid') });
        return;
    }

    setActionLoading(true);
    try {
      await requestWithdrawal(amount, shaba);
      toast({ title: t('wallet.withdrawRequestSuccess') });
      setWithdrawAmount('');
      setShaba('');
      fetchWallet();
    } catch (err: any) {
      toast({ variant: 'destructive', title: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) return <div className="container py-20 flex justify-center"><Loader2 className="animate-spin h-10 w-10" /></div>;

  return (
    <div className="container max-w-5xl py-12 space-y-8">
      <div className="flex items-center gap-4">
        <Wallet className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold">{t('wallet.title')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-lg opacity-90">{t('wallet.balance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {getFormattedPrice(Number(wallet?.balance || 0), 'TOMAN', t)}
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary" className="flex-1"><ArrowUpCircle className="w-4 h-4 mr-2" /> {t('wallet.deposit')}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('wallet.depositTitle')}</DialogTitle>
                  <DialogDescription>{t('wallet.depositDesc')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{t('admin.export.amount')} ({t('admin.currency.TOMAN')})</Label>
                    <Input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="50,000" />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleDeposit} disabled={actionLoading} className="w-full">
                    {actionLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                    {t('wallet.payAndCharge')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 bg-transparent text-white border-white/30 hover:bg-white/10">
                  <ArrowDownCircle className="w-4 h-4 mr-2" /> {t('wallet.withdraw')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('wallet.withdrawTitle')}</DialogTitle>
                  <DialogDescription>{t('wallet.withdrawDesc')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{t('admin.export.amount')} ({t('admin.currency.TOMAN')})</Label>
                    <Input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('wallet.shabaLabel')}</Label>
                    <Input dir="ltr" placeholder="IR000000000000000000000000" value={shaba} onChange={e => setShaba(e.target.value)} />
                    <p className="text-xs text-muted-foreground">{t('wallet.shabaHelper')}</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleWithdraw} disabled={actionLoading} className="w-full">
                    {actionLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                    {t('wallet.submitWithdraw')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> {t('wallet.history')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.export.status')}</TableHead>
                  <TableHead>{t('admin.export.amount')}</TableHead>
                  <TableHead>{t('admin.export.date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallet?.transactions.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">{t('wallet.noTransactions')}</TableCell></TableRow>
                ) : wallet?.transactions.map((tx: any) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <Badge variant={tx.amount > 0 ? 'default' : 'secondary'}>
                        {t(`wallet.txType.${tx.type}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className={tx.amount > 0 ? 'text-green-600' : 'text-red-600'} dir="ltr">
                      {tx.amount > 0 ? '+' : ''}{Number(tx.amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(tx.createdAt), 'yyyy/MM/dd HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
