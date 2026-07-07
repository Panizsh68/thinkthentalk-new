'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/language-provider';
import { getSubscriptionPlans, getMySubscription, purchaseSubscription } from '@/lib/api/subscriptions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns-jalali';

export default function SubscriptionPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [mySub, setMySub] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansData, subData] = await Promise.all([
        getSubscriptionPlans(),
        getMySubscription()
      ]);
      setPlans(plansData);
      setMySub(subData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (planId: string) => {
    setBuyingId(planId);
    try {
      await purchaseSubscription(planId);
      toast({ title: t('subscription.successTitle'), description: t('subscription.successDesc') });
      loadData();
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('errors.genericTitle'), description: err.message });
    } finally {
      setBuyingId(null);
    }
  };

  if (isLoading) return <div className="container py-20 flex justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <div className="container max-w-6xl py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <Sparkles className="h-12 w-12 text-primary mx-auto" />
        <h1 className="text-4xl font-black tracking-tight">{t('subscription.title')}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">{t('subscription.subtitle')}</p>
      </div>

      {mySub && mySub.isActive && new Date(mySub.endDate) > new Date() && (
        <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-4 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-6">
                <div className="p-4 bg-primary rounded-2xl shadow-lg">
                  <ShieldCheck className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                    <CardTitle className="text-xl font-black text-primary">{t('subscription.activeTitle', { plan: mySub.planName })}</CardTitle>
                    <CardDescription className="text-base font-bold mt-1 opacity-80">{t('subscription.activeDesc', { date: format(new Date(mySub.endDate), 'yyyy/MM/dd') })}</CardDescription>
                </div>
            </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
        {plans.map((plan) => (
          <Card key={plan.id} className={cn("relative flex flex-col transition-all hover:shadow-2xl hover:-translate-y-2 border-2 rounded-[2.5rem] bg-card overflow-hidden", plan.durationDays > 100 ? "border-primary shadow-xl" : "border-border/40")}>
            {plan.durationDays > 100 && (
                <div className="absolute top-4 right-1/2 translate-x-1/2 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
                    {t('subscription.bestValue')}
                </div>
            )}
            <CardHeader className="text-center pt-12 pb-8">
              <CardTitle className="text-2xl font-black">{plan.name}</CardTitle>
              <CardDescription className="font-bold">{plan.description || t('subscription.planPlaceholder')}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-8 px-8">
              <div className="text-center bg-muted/30 py-6 rounded-[1.5rem] border border-border/20">
                <span className="text-4xl font-black tracking-tighter">{Number(plan.price).toLocaleString()}</span>
                <span className="text-xs font-bold text-muted-foreground ml-2 uppercase tracking-widest">{t('admin.currency.COIN')}</span>
              </div>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 font-bold text-sm text-foreground/80"><Check className="h-5 w-5 text-green-500 bg-green-50 rounded-full p-1" /> {t('subscription.perks.events')}</li>
                <li className="flex items-center gap-3 font-bold text-sm text-foreground/80"><Check className="h-5 w-5 text-green-500 bg-green-50 rounded-full p-1" /> {t('subscription.perks.resources')}</li>
                <li className="flex items-center gap-3 font-bold text-sm text-foreground/80"><Check className="h-5 w-5 text-green-500 bg-green-50 rounded-full p-1" /> {t('subscription.perks.support')}</li>
              </ul>
            </CardContent>
            <CardFooter className="p-8">
              <Button 
                className="w-full h-14 rounded-2xl font-black text-lg shadow-md group" 
                size="lg"
                disabled={buyingId === plan.id}
                onClick={() => handlePurchase(plan.id)}
              >
                {buyingId === plan.id ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Zap className="h-5 w-5 mr-2 fill-current transition-transform group-hover:scale-125" />}
                {t('subscription.buyNow')}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}