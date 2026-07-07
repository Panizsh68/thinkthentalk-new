'use client';
import { useAuth } from '@/lib/auth/auth-provider';
import { useUserRegistrationsQuery } from '@/hooks/use-registration-queries';
import { useMyWallet } from '@/lib/api/wallet';
import { useMySubscription } from '@/lib/api/subscriptions';
import { Loader2, AlertTriangle, Sparkles, Calendar, History, ArrowRight, UserCog, Coins, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-provider';
import { RegistrationCard } from '@/components/registration-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { isEventPast } from '@/lib/event-helpers';
import { useMemo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getMyWallet } from '@/lib/api/wallet';
import { getMySubscription } from '@/lib/api/subscriptions';

export default function UserDashboardPage() {
  const { t, language } = useLanguage();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const { data: registrations, isLoading: isLoadingRegistrations, error, refetch } = useUserRegistrationsQuery(currentUser?.id);
  const [wallet, setWallet] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  
  const isRTL = language === 'fa';

  useEffect(() => {
    if (currentUser) {
      Promise.all([getMyWallet(), getMySubscription()])
        .then(([w, s]) => {
          setWallet(w);
          setSubscription(s);
        })
        .catch(console.error)
        .finally(() => setIsLoadingMeta(false));
    }
  }, [currentUser]);

  const isLoading = isAuthLoading || isLoadingRegistrations || isLoadingMeta;

  const { upcoming, past } = useMemo(() => {
    if (!registrations) return { upcoming: [], past: [] };
    return {
      upcoming: registrations.filter(reg => !isEventPast({ startDateTime: reg.event.startDateTime })),
      past: registrations.filter(reg => isEventPast({ startDateTime: reg.event.startDateTime })),
    };
  }, [registrations]);

  const isProfileIncomplete = useMemo(() => {
    if (!currentUser) return true;
    return !currentUser.firstNameFa || currentUser.firstNameFa === 'نام' || !currentUser.educationLevel;
  }, [currentUser]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive gap-4">
        <AlertTriangle className="h-8 w-8" />
        <p>{t('errors.fetchRegistrations')}</p>
        <Button onClick={() => refetch()} variant="outline">{t('actions.retry')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <section className="bg-primary/5 p-6 md:p-8 rounded-[2.5rem] border border-primary/10 relative overflow-hidden">
        <div className={cn("relative z-10", isRTL && "text-right")}>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            {t('dashboard.welcomeBack', { name: currentUser?.firstNameFa !== 'نام' ? currentUser?.firstNameFa : '' })}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-prose font-medium">
            {t('dashboard.personalIntro')}
          </p>
        </div>
        <Sparkles className="absolute -right-4 -bottom-4 h-32 w-32 text-primary/5 pointer-events-none" />
      </section>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsSummaryItem 
          icon={Calendar} 
          label={t('dashboard.upcomingSection')} 
          value={upcoming.length} 
          color="text-blue-600" 
          bg="bg-blue-50"
          isRTL={isRTL}
        />
        <StatsSummaryItem 
          icon={Coins} 
          label={t('wallet.balance')} 
          value={Number(wallet?.balance || 0).toLocaleString()} 
          color="text-amber-600" 
          bg="bg-amber-50"
          isRTL={isRTL}
          href="/wallet"
        />
        <StatsSummaryItem 
          icon={ShieldCheck} 
          label={t('subscription.title')} 
          value={subscription?.isActive ? t('profile.identity.linked') : t('profile.identity.notLinked')} 
          color="text-purple-600" 
          bg="bg-purple-50"
          isRTL={isRTL}
          href="/subscription"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="upcoming" className="w-full">
            <div className={cn("flex items-center justify-between mb-6 border-b border-border/40", isRTL && "flex-row-reverse")}>
              <TabsList className="bg-transparent border-none p-0 h-auto gap-8">
                <TabsTrigger value="upcoming" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none pb-4 font-bold transition-all">
                  <Calendar className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                  {t('dashboard.upcomingSection')}
                </TabsTrigger>
                <TabsTrigger value="past" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none pb-4 font-bold transition-all">
                  <History className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                  {t('dashboard.pastSection')}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="upcoming" className="mt-0 outline-none">
              {upcoming.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcoming.map((reg) => <RegistrationCard key={reg.id} registration={reg} />)}
                </div>
              ) : (
                <EmptyState icon={Calendar} message={t('dashboard.noUpcoming')} linkText={t('dashboard.browseEvents')} href="/events" />
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-0 outline-none">
              {past.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {past.map((reg) => <RegistrationCard key={reg.id} registration={reg} />)}
                </div>
              ) : (
                <EmptyState icon={History} message={t('dashboard.noPast')} />
              )}
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-6">
          {isProfileIncomplete && (
            <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 rounded-[1.5rem] shadow-sm">
               <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-800 dark:text-amber-400">
                  <UserCog className="w-4 h-4" />
                  {t('admin.users.badges.incomplete')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-xs text-amber-700 dark:text-amber-500 mb-4 leading-relaxed font-medium">
                  {t('profile.subtitle')}
                </p>
                <Button asChild size="sm" variant="outline" className="w-full border-amber-300 bg-white/50 hover:bg-amber-100 text-amber-900 rounded-xl font-bold">
                   <Link href="/profile">{t('profile.saveButton')}</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="bg-secondary/20 border-none shadow-none rounded-[1.5rem] p-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 font-black">
                <Sparkles className="w-5 h-5 text-primary" />
                {t('dashboard.nextStepTitle')}
              </CardTitle>
              <CardDescription className="font-medium">{t('dashboard.nextStepDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full group h-12 rounded-xl font-bold shadow-md">
                <Link href="/events">
                  {t('dashboard.browseEvents')}
                  <ArrowRight className={cn("ml-2 h-4 w-4 transition-transform group-hover:translate-x-1", isRTL && "rotate-180")} />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function StatsSummaryItem({ icon: Icon, label, value, color, bg, isRTL, href }: any) {
  const content = (
    <div className={cn("p-4 rounded-2xl border border-border/40 flex items-center gap-4 transition-all hover:shadow-md bg-card", isRTL && "flex-row-reverse")}>
      <div className={cn("p-3 rounded-xl", bg)}>
        <Icon className={cn("w-5 h-5", color)} />
      </div>
      <div className={cn(isRTL && "text-right")}>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">{label}</p>
        <p className="text-lg font-black">{value}</p>
      </div>
    </div>
  );

  return href ? <Link href={href} className="block">{content}</Link> : content;
}

function EmptyState({ icon: Icon, message, linkText, href }: { icon: any, message: string, linkText?: string, href?: string }) {
  const { t } = useLanguage();
  return (
    <div className="text-center py-20 border-2 border-dashed rounded-[2rem] bg-muted/20 border-border/60">
        <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-10" />
        <p className="text-muted-foreground font-medium">{message}</p>
        {linkText && href && (
            <Button asChild variant="link" className="mt-2 text-primary font-bold">
                <Link href={href}>{linkText}</Link>
            </Button>
        )}
    </div>
  )
}