'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  Coins,
  CreditCard,
  LayoutDashboard,
  Loader2,
  ShieldCheck,
  Sparkles,
  UserCog,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/auth-provider';
import { isCoinCenterEnabled } from '@/lib/config/features';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useUserRegistrationsQuery } from '@/hooks/use-registration-queries';
import { getMyWallet } from '@/lib/api/wallet';
import { getMySubscription } from '@/lib/api/subscriptions';
import { isEventPast } from '@/lib/event-helpers';
import { cn } from '@/lib/utils';
import type { WalletWithTransactions } from '@/lib/types';

type ActivityItem = {
  id: string;
  date: Date;
  title: string;
  description: string;
  tone: 'default' | 'success' | 'warning';
};

export default function UserDashboardPage() {
  const { t, language } = useLanguage();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const { data: registrations, isLoading: registrationsLoading, error, refetch } = useUserRegistrationsQuery(
    currentUser?.id,
  );

  const coinCenterEnabled = isCoinCenterEnabled();
  const [wallet, setWallet] = useState<WalletWithTransactions | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const isRTL = language === 'fa';

  useEffect(() => {
    if (!currentUser) {
      setMetaLoading(false);
      return;
    }

    setMetaLoading(true);
    Promise.all([
      getMySubscription(),
      coinCenterEnabled ? getMyWallet() : Promise.resolve(null),
    ])
      .then(([subscriptionData, walletData]) => {
        setSubscription(subscriptionData);
        setWallet(walletData);
      })
      .catch(console.error)
      .finally(() => setMetaLoading(false));
  }, [coinCenterEnabled, currentUser]);

  const isLoading = isAuthLoading || registrationsLoading || metaLoading;

  const { upcoming, past } = useMemo(() => {
    if (!registrations) return { upcoming: [], past: [] };

    return {
      upcoming: registrations.filter((reg) => !isEventPast({ startDateTime: reg.event.startDateTime })),
      past: registrations.filter((reg) => isEventPast({ startDateTime: reg.event.startDateTime })),
    };
  }, [registrations]);

  const isProfileIncomplete = useMemo(() => {
    if (!currentUser) return true;

    return (
      !currentUser.firstNameFa ||
      currentUser.firstNameFa === 'نام' ||
      !currentUser.educationLevel ||
      !currentUser.languageLevel
    );
  }, [currentUser]);

  const isSubscriptionActive = !!(
    subscription?.isActive &&
    subscription?.endDate &&
    new Date(subscription.endDate) > new Date()
  );

  const lowBalance = coinCenterEnabled ? Number(wallet?.balance || 0) < 3 : false;

  const activity = useMemo<ActivityItem[]>(() => {
    const registrationItems: ActivityItem[] =
      registrations?.map((reg) => ({
        id: `registration-${reg.id}`,
        date: new Date(reg.createdAt),
        title: reg.event.title[language] || reg.event.title.en || reg.event.title.fa,
        description: `${t('dashboard.activity.registration')} • ${t(`registration.status.${reg.status.toLowerCase()}`)}`,
        tone: reg.status === 'PAID' ? 'success' : 'default',
      })) ?? [];

    const walletItems: ActivityItem[] = coinCenterEnabled
      ? wallet?.transactions.map((tx) => ({
          id: `wallet-${tx.id}`,
          date: new Date(tx.createdAt),
          title:
            tx.type === 'DEPOSIT'
              ? t('dashboard.activity.walletDeposit')
              : tx.type === 'PURCHASE'
                ? t('dashboard.activity.walletSpend')
                : t(`wallet.txType.${tx.type}`),
          description: `${Number(tx.amount).toLocaleString()} ${t('admin.currency.COIN')}`,
          tone: tx.status === 'FAILED' ? 'warning' : tx.type === 'DEPOSIT' ? 'success' : 'default',
        })) ?? []
      : [];

    return [...registrationItems, ...walletItems]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 6);
  }, [coinCenterEnabled, language, registrations, t, wallet?.transactions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center text-destructive">
        <AlertTriangle className="h-8 w-8" />
        <p>{t('errors.fetchRegistrations')}</p>
        <Button onClick={() => refetch()} variant="outline">
          {t('actions.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_35%),linear-gradient(135deg,rgba(15,23,42,0.03),rgba(15,23,42,0))] p-6 md:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className={cn('relative space-y-4', isRTL && 'text-right')}>
          <Badge className="rounded-full px-3 py-1 font-bold">{t('dashboard.title')}</Badge>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">
            {t('dashboard.welcomeBack')}
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            {t('dashboard.overviewDescription')}
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={CalendarCheck}
          label={t('dashboard.summary.upcoming')}
          value={upcoming.length}
          href="/my-events"
          isRTL={isRTL}
        />
        <SummaryCard
          icon={LayoutDashboard}
          label={t('dashboard.summary.totalEvents')}
          value={registrations?.length || 0}
          href="/my-events"
          isRTL={isRTL}
        />
        {coinCenterEnabled ? (
          <SummaryCard
            icon={Coins}
            label={t('dashboard.summary.walletBalance')}
            value={`${Number(wallet?.balance || 0).toLocaleString()} ${t('admin.currency.COIN')}`}
            href="/wallet"
            isRTL={isRTL}
          />
        ) : (
          <SummaryCard
            icon={CreditCard}
            label={t('dashboard.summary.subscription')}
            value={isSubscriptionActive ? t('dashboard.activeSubscription') : t('dashboard.inactiveSubscription')}
            href="/subscription"
            isRTL={isRTL}
          />
        )}
        <SummaryCard
          icon={ShieldCheck}
          label={t('profile.title')}
          value={isProfileIncomplete ? t('dashboard.profileStatusIncomplete') : t('dashboard.profileStatusComplete')}
          href="/profile"
          isRTL={isRTL}
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-8">
          <Card className="rounded-[2rem] border-border/40">
            <CardHeader>
              <CardTitle className="text-xl font-black">{t('dashboard.quickActionsTitle')}</CardTitle>
              <CardDescription>{t('dashboard.quickActionsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <QuickActionCard
                href="/my-events"
                icon={CalendarCheck}
                title={t('dashboard.myRegistrations')}
                description={t('dashboard.quickActions.events')}
              />
              {coinCenterEnabled ? (
                <QuickActionCard
                  href="/wallet"
                  icon={Coins}
                  title={t('nav.wallet')}
                  description={t('dashboard.quickActions.wallet')}
                />
              ) : (
                <QuickActionCard
                  href="/events"
                  icon={LayoutDashboard}
                  title={t('nav.events')}
                  description={t('dashboard.quickActions.events')}
                />
              )}
              <QuickActionCard
                href="/subscription"
                icon={CreditCard}
                title={t('subscription.title')}
                description={t('dashboard.quickActions.subscription')}
              />
              <QuickActionCard
                href="/profile"
                icon={UserCog}
                title={t('profile.title')}
                description={t('dashboard.quickActions.profile')}
              />
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-border/40">
            <CardHeader>
              <CardTitle className="text-xl font-black">{t('dashboard.activityTitle')}</CardTitle>
              <CardDescription>{t('dashboard.activityDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <div className="rounded-[1.5rem] border-2 border-dashed border-border/60 bg-muted/20 py-14 text-center">
                  <Sparkles className="mx-auto mb-4 h-10 w-10 text-muted-foreground/30" />
                  <p className="font-medium text-muted-foreground">{t('dashboard.activity.empty')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activity.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-4 rounded-[1.5rem] border border-border/50 bg-card px-4 py-4"
                    >
                      <div className={cn('space-y-1', isRTL && 'text-right')}>
                        <p className="font-bold">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <Badge variant={item.tone === 'warning' ? 'destructive' : item.tone === 'success' ? 'default' : 'secondary'}>
                        {new Intl.DateTimeFormat(language === 'fa' ? 'fa-IR' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                        }).format(item.date)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-8">
          <Card className="rounded-[2rem] border-border/40">
            <CardHeader>
              <CardTitle className="text-xl font-black">{t('dashboard.attentionTitle')}</CardTitle>
              <CardDescription>{t('dashboard.attentionDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <AttentionItem
                show={isProfileIncomplete}
                href="/profile"
                label={t('dashboard.attention.completeProfile')}
              />
              {coinCenterEnabled ? (
                <AttentionItem
                  show={lowBalance}
                  href="/wallet"
                  label={t('dashboard.attention.chargeWallet')}
                />
              ) : null}
              <AttentionItem
                show={!isSubscriptionActive}
                href="/subscription"
                label={t('dashboard.attention.buyPass')}
              />
              <AttentionItem
                show={upcoming.length === 0}
                href="/events"
                label={t('dashboard.attention.bookEvent')}
              />
              {!isProfileIncomplete && (!coinCenterEnabled || !lowBalance) && isSubscriptionActive && upcoming.length > 0 ? (
                <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-800">
                  {t('dashboard.attention.ready')}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-border/40">
            <CardHeader>
              <CardTitle className="text-xl font-black">{t('dashboard.profileCardTitle')}</CardTitle>
              <CardDescription>{t('dashboard.profileCardDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow
                label={t('profile.title')}
                value={isProfileIncomplete ? t('dashboard.profileStatusIncomplete') : t('dashboard.profileStatusComplete')}
              />
              <InfoRow
                label={t('auth.mobileLabel')}
                value={currentUser?.mobile || '—'}
              />
              <InfoRow
                label={t('registration.fields.email')}
                value={currentUser?.email || '—'}
              />
              <Button asChild variant="outline" className="w-full rounded-xl font-bold">
                <Link href="/profile">{t('profile.saveButton')}</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  href,
  isRTL,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  href: string;
  isRTL: boolean;
}) {
  return (
    <Link href={href} className="block">
      <Card className="h-full rounded-[1.5rem] border-border/40 transition-transform hover:-translate-y-1 hover:shadow-lg">
        <CardContent className={cn('flex items-center gap-4 p-5', isRTL && 'flex-row-reverse')}>
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className={cn('space-y-1', isRTL && 'text-right')}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
            <p className="text-2xl font-black">{value}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="block">
      <div className="rounded-[1.5rem] border border-border/50 bg-muted/20 p-5 transition-all hover:border-primary/30 hover:bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-black">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function AttentionItem({
  show,
  href,
  label,
}: {
  show: boolean;
  href: string;
  label: string;
}) {
  if (!show) return null;

  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100"
    >
      <span>{label}</span>
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[1.25rem] border border-border/50 bg-muted/20 px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
