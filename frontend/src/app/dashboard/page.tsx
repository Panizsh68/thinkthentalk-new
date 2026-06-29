'use client';
import { useAuth } from '@/lib/auth/auth-provider';
import { useUserRegistrationsQuery } from '@/hooks/use-registration-queries';
import { Loader2, AlertTriangle, Sparkles, Calendar, History, ArrowRight, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-provider';
import { RegistrationCard } from '@/components/registration-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { isEventPast } from '@/lib/event-helpers';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export default function UserDashboardPage() {
  const { t, language } = useLanguage();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const { data: registrations, isLoading: isLoadingRegistrations, error, refetch } = useUserRegistrationsQuery(currentUser?.id);
  const isRTL = language === 'fa';

  const isLoading = isAuthLoading || isLoadingRegistrations;

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
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
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
      <section className="bg-primary/5 p-6 md:p-8 rounded-3xl border border-primary/10 relative overflow-hidden">
        <div className={cn("relative z-10", isRTL && "text-right")}>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t('dashboard.welcomeBack', { name: '' })}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-prose">
            {t('dashboard.personalIntro')}
          </p>
        </div>
        <Sparkles className="absolute -right-4 -bottom-4 h-32 w-32 text-primary/5 pointer-events-none" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="upcoming" className="w-full">
            <div className={cn("flex items-center justify-between mb-4 border-b", isRTL && "flex-row-reverse")}>
              <TabsList className="bg-transparent border-none p-0 h-auto">
                <TabsTrigger value="upcoming" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2">
                  <Calendar className="w-4 h-4 mr-2 ml-2" />
                  {t('dashboard.upcomingSection')}
                </TabsTrigger>
                <TabsTrigger value="past" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2">
                  <History className="w-4 h-4 mr-2 ml-2" />
                  {t('dashboard.pastSection')}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="upcoming" className="mt-0">
              {upcoming.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcoming.map((reg) => <RegistrationCard key={reg.id} registration={reg} />)}
                </div>
              ) : (
                <EmptyState icon={Calendar} message={t('dashboard.noUpcoming')} linkText={t('dashboard.browseEvents')} href="/events" />
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-0">
              {past.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
               <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-800 dark:text-amber-400">
                  <UserCog className="w-4 h-4" />
                  {t('admin.users.badges.incomplete')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-xs text-amber-700 dark:text-amber-500 mb-3">{t('profile.subtitle')}</p>
                <Button asChild size="sm" variant="outline" className="w-full border-amber-300 hover:bg-amber-100">
                   <Link href="/profile">{t('profile.saveButton')}</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="bg-secondary/20 border-none shadow-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {t('dashboard.nextStepTitle')}
              </CardTitle>
              <CardDescription>{t('dashboard.nextStepDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full group">
                <Link href="/events">
                  {t('dashboard.browseEvents')}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message, linkText, href }: { icon: any, message: string, linkText?: string, href?: string }) {
  return (
    <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/30">
        <Icon className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
        <p className="text-muted-foreground">{message}</p>
        {linkText && href && (
            <Button asChild variant="link" className="mt-2">
                <Link href={href}>{linkText}</Link>
            </Button>
        )}
    </div>
  )
}
