'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/language-provider';
import { getMyWallet, depositFunds } from '@/lib/api/wallet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Coins, History, Loader2, Sparkles, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns-jalali';
import { cn } from '@/lib/utils';

export default function WalletPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
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

  const handleDeposit = async () => {
    const amount = Number(depositAmount);
    if (!amount || amount < 100) {
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

  if (isLoading) return <div className="container py-20 flex justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <div className="container max-w-5xl py-12 space-y-8 animate-in fade-in duration-500">
      <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
        <div className="p-3 bg-primary/10 rounded-2xl">
          <Coins className="h-8 w-8 text-primary" />
        </div>
        <div className={cn(isRTL && "text-right")}>
          <h1 className="text-3xl font-black tracking-tight">{t('wallet.title')}</h1>
          <p className="text-muted-foreground text-sm font-medium">{t('wallet.depositDesc')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-1 border-none shadow-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden relative rounded-[2.5rem]">
          <Sparkles className="absolute -right-4 -bottom-4 h-32 w-32 opacity-10" />
          <CardHeader>
            <CardTitle className="text-xs font-black opacity-80 uppercase tracking-widest">{t('wallet.balance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("flex items-baseline gap-2", isRTL && "flex-row-reverse")}>
              <span className="text-6xl font-black">{Number(wallet?.balance || 0).toLocaleString()}</span>
              <span className="text-sm font-bold opacity-80">{t('admin.currency.COIN')}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary" className="w-full h-14 rounded-2xl font-black bg-white text-primary hover:bg-white/90 shadow-lg">
                  <ShoppingBag className={cn("w-5 h-5", isRTL ? "ml-2" : "mr-2")} />
                  {t('wallet.deposit')}
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2rem]">
                <DialogHeader className={cn(isRTL && "text-right")}>
                  <DialogTitle className="font-black text-xl">{t('wallet.depositTitle')}</DialogTitle>
                  <DialogDescription className="font-medium">{t('wallet.depositDesc')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-6">
                  <div className="space-y-3">
                    <Label className="font-bold">{t('admin.export.amount')} ({t('admin.currency.COIN')})</Label>
                    <Input 
                      type="number" 
                      value={depositAmount} 
                      onChange={e => setDepositAmount(e.target.value)} 
                      placeholder="e.g. 500"
                      className="h-14 rounded-2xl text-lg font-black"
                    />
                  </div>
                  <div className="p-4 bg-muted/50 rounded-2xl text-[11px] text-muted-foreground leading-relaxed font-medium">
                    Note: Talk Coins are non-refundable tokens used exclusively for community services and registrations.
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleDeposit} disabled={actionLoading} className="w-full h-14 rounded-2xl font-black text-lg">
                    {actionLoading && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
                    {t('wallet.payAndCharge')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2 rounded-[2.5rem] border-border/40 shadow-sm overflow-hidden bg-card/50">
          <CardHeader className="border-b border-border/40 bg-muted/20">
            <CardTitle className={cn("flex items-center gap-2 text-lg font-black", isRTL && "flex-row-reverse")}>
              <History className="h-5 w-5 text-primary" />
              {t('wallet.history')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className={cn(isRTL ? "text-right" : "text-left", "font-black uppercase text-[10px] tracking-widest")}>{t('admin.export.status')}</TableHead>
                    <TableHead className={cn(isRTL ? "text-right" : "text-left", "font-black uppercase text-[10px] tracking-widest")}>{t('admin.export.amount')}</TableHead>
                    <TableHead className={cn(isRTL ? "text-right" : "text-left", "font-black uppercase text-[10px] tracking-widest")}>{t('admin.export.date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wallet?.transactions.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-20 text-muted-foreground font-bold opacity-30">{t('wallet.noTransactions')}</TableCell></TableRow>
                  ) : wallet?.transactions.map((tx: any) => (
                    <TableRow key={tx.id} className="border-border/20 transition-colors hover:bg-muted/10">
                      <TableCell className={cn(isRTL && "text-right")}>
                        <Badge variant={tx.type === 'DEPOSIT' || tx.type === 'REFUND' ? 'default' : 'secondary'} className="rounded-md font-black px-2 py-0.5 text-[10px] uppercase tracking-tighter">
                          {t(`wallet.txType.${tx.type}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn("font-black tracking-tight text-base", (tx.type === 'DEPOSIT' || tx.type === 'REFUND') ? 'text-emerald-600' : 'text-foreground')} dir="ltr">
                        {(tx.type === 'DEPOSIT' || tx.type === 'REFUND') ? '+' : '-'}{Number(tx.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className={cn("text-xs text-muted-foreground font-bold", isRTL && "text-right")}>
                          {format(new Date(tx.createdAt), 'yyyy/MM/dd HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
