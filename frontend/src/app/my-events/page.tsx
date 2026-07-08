'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  History,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RegistrationCard } from '@/components/registration-card';
import { useAuth } from '@/lib/auth/auth-provider';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useUserRegistrationsQuery } from '@/hooks/use-registration-queries';
import { isEventPast } from '@/lib/event-helpers';
import { cn } from '@/lib/utils';

export default function MyEventsPage() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const { t, language } = useLanguage();
  const { data: registrations, isLoading, error, refetch } = useUserRegistrationsQuery(currentUser?.id);
  const isRTL = language === 'fa';

  const { upcoming, past } = useMemo(() => {
    if (!registrations) return { upcoming: [], past: [] };

    return {
      upcoming: registrations.filter((reg) => !isEventPast({ startDateTime: reg.event.startDateTime })),
      past: registrations.filter((reg) => isEventPast({ startDateTime: reg.event.startDateTime })),
    };
  }, [registrations]);

  if (isAuthLoading || isLoading) {
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
      <section className="rounded-[2rem] border border-primary/15 bg-primary/5 p-6 md:p-8">
        <div className={cn('space-y-3', isRTL && 'text-right')}>
          <h1 className="text-3xl font-black tracking-tight">{t('dashboard.eventsTitle')}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            {t('dashboard.eventsDescription')}
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <EventCountCard label={t('dashboard.upcomingSection')} value={upcoming.length} icon={Calendar} />
        <EventCountCard label={t('dashboard.pastSection')} value={past.length} icon={History} />
        <Card className="rounded-[1.5rem] border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-black">{t('dashboard.nextStepTitle')}</CardTitle>
            <CardDescription>{t('dashboard.nextStepDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full rounded-xl font-bold">
              <Link href="/events">
                {t('dashboard.browseEvents')}
                <ArrowRight className={cn('ml-2 h-4 w-4', isRTL && 'rotate-180')} />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2rem] border-border/40">
        <CardHeader className="border-b border-border/40">
          <CardTitle className="text-xl font-black">{t('dashboard.myRegistrations')}</CardTitle>
          <CardDescription>{t('dashboard.eventsHelper')}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="mb-6 h-auto rounded-2xl bg-muted/60 p-1">
              <TabsTrigger value="upcoming" className="rounded-xl px-5 py-2.5 font-bold">
                {t('dashboard.upcomingSection')}
              </TabsTrigger>
              <TabsTrigger value="past" className="rounded-xl px-5 py-2.5 font-bold">
                {t('dashboard.pastSection')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-0">
              {upcoming.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {upcoming.map((reg) => (
                    <RegistrationCard key={reg.id} registration={reg} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Calendar}
                  message={t('dashboard.noUpcoming')}
                  linkText={t('dashboard.browseEvents')}
                  href="/events"
                />
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-0">
              {past.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {past.map((reg) => (
                    <RegistrationCard key={reg.id} registration={reg} />
                  ))}
                </div>
              ) : (
                <EmptyState icon={History} message={t('dashboard.noPast')} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function EventCountCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <Card className="rounded-[1.5rem] border-border/40">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-black">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  message,
  linkText,
  href,
}: {
  icon: React.ElementType;
  message: string;
  linkText?: string;
  href?: string;
}) {
  return (
    <div className="rounded-[1.75rem] border-2 border-dashed border-border/60 bg-muted/20 py-20 text-center">
      <Icon className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
      <p className="font-medium text-muted-foreground">{message}</p>
      {linkText && href ? (
        <Button asChild variant="link" className="mt-3 font-bold">
          <Link href={href}>{linkText}</Link>
        </Button>
      ) : null}
    </div>
  );
}
