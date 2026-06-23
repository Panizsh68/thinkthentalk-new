'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/language-provider';
import { getSubscriptionPlans, getMySubscription, purchaseSubscription } from '@/lib/api/subscriptions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getFormattedPrice } from '@/lib/event-helpers';
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

  if (isLoading) return <div className="container py-20 flex justify-center"><Loader2 className="animate-spin h-10 w-10" /></div>;

  return (
    <div className="container max-w-6xl py-12 space-y-12">
      <div className="text-center space-y-4">
        <Sparkles className="h-12 w-12 text-primary mx-auto" />
        <h1 className="text-4xl font-bold tracking-tight">{t('subscription.title')}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t('subscription.subtitle')}</p>
      </div>

      {mySub && mySub.isActive && new Date(mySub.endDate) > new Date() && (
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center gap-4">
                <ShieldCheck className="h-10 w-10 text-primary" />
                <div>
                    <CardTitle>{t('subscription.activeTitle', { plan: mySub.planName })}</CardTitle>
                    <CardDescription>{t('subscription.activeDesc', { date: format(new Date(mySub.endDate), 'yyyy/MM/dd') })}</CardDescription>
                </div>
            </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card key={plan.id} className={cn("relative flex flex-col transition-all hover:shadow-lg border-2", plan.durationDays > 100 && "border-primary shadow-md")}>
            {plan.durationDays > 100 && (
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {t('subscription.bestValue')}
                </div>
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description || t('subscription.planPlaceholder')}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <div className="text-center">
                <span className="text-4xl font-bold">{getFormattedPrice(Number(plan.price), 'TOMAN', t)}</span>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> {t('subscription.perks.events')}</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> {t('subscription.perks.resources')}</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> {t('subscription.perks.support')}</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                size="lg"
                disabled={buyingId === plan.id}
                onClick={() => handlePurchase(plan.id)}
              >
                {buyingId === plan.id ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                {t('subscription.buyNow')}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
