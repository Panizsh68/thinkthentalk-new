'use client';

import { AlertTriangle, Briefcase, Building2, Loader2 } from 'lucide-react';
import { format } from 'date-fns-jalali';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-provider';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useMyCollaborationsQuery, useMySponsorshipsQuery } from '@/hooks/use-partnership-queries';

const statusStyles = {
  PENDING: 'bg-amber-100 text-amber-900 border-amber-200',
  REVIEWING: 'bg-sky-100 text-sky-900 border-sky-200',
  CONTACTED: 'bg-violet-100 text-violet-900 border-violet-200',
  ACCEPTED: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-900 border-rose-200',
} as const;

export default function MyRequestsPage() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const { t } = useLanguage();
  const {
    data: collaborations,
    isLoading: loadingCollaborations,
    error: collaborationsError,
    refetch: refetchCollaborations,
  } = useMyCollaborationsQuery(!!currentUser);
  const {
    data: sponsorships,
    isLoading: loadingSponsorships,
    error: sponsorshipsError,
    refetch: refetchSponsorships,
  } = useMySponsorshipsQuery(!!currentUser);

  if (isAuthLoading || loadingCollaborations || loadingSponsorships) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (collaborationsError || sponsorshipsError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center text-destructive">
        <AlertTriangle className="h-8 w-8" />
        <p>{t('partnership.panel.loadError')}</p>
        <Button
          onClick={() => {
            refetchCollaborations();
            refetchSponsorships();
          }}
          variant="outline"
        >
          {t('actions.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-primary/15 bg-primary/5 p-6 md:p-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight">{t('partnership.panel.title')}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            {t('partnership.panel.description')}
          </p>
        </div>
      </section>

      <Tabs defaultValue="collaborations" className="w-full">
        <TabsList className="mb-6 h-auto rounded-2xl bg-muted/60 p-1">
          <TabsTrigger value="collaborations" className="rounded-xl px-5 py-2.5 font-bold">
            {t('partnership.panel.tabs.collaborations')}
          </TabsTrigger>
          <TabsTrigger value="sponsorships" className="rounded-xl px-5 py-2.5 font-bold">
            {t('partnership.panel.tabs.sponsorships')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="collaborations" className="mt-0">
          <RequestSection
            title={t('partnership.panel.collaborationsTitle')}
            description={t('partnership.panel.collaborationsDescription')}
            empty={t('partnership.panel.emptyCollaborations')}
            icon={Briefcase}
            items={collaborations ?? []}
            renderBody={(item: any) => (
              <>
                <p className="text-sm text-muted-foreground">{item.fieldOfExpertise}</p>
                <p className="text-sm leading-7 text-foreground/85">{item.whyJoin}</p>
              </>
            )}
            t={t}
          />
        </TabsContent>

        <TabsContent value="sponsorships" className="mt-0">
          <RequestSection
            title={t('partnership.panel.sponsorshipsTitle')}
            description={t('partnership.panel.sponsorshipsDescription')}
            empty={t('partnership.panel.emptySponsorships')}
            icon={Building2}
            items={sponsorships ?? []}
            renderBody={(item: any) => (
              <>
                <p className="text-sm text-muted-foreground">
                  {item.companyName} • {t(`sponsorship.plans.${item.plan}.name`)}
                </p>
                <p className="text-sm leading-7 text-foreground/85">
                  {item.description || t('registration.summary.noInfo')}
                </p>
              </>
            )}
            t={t}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RequestSection({
  title,
  description,
  empty,
  icon: Icon,
  items,
  renderBody,
  t,
}: {
  title: string;
  description: string;
  empty: string;
  icon: React.ElementType;
  items: any[];
  renderBody: (item: any) => React.ReactNode;
  t: (key: string, vars?: Record<string, any>) => string;
}) {
  if (!items.length) {
    return (
      <Card className="rounded-[2rem] border-border/40">
        <CardContent className="py-20 text-center">
          <Icon className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">{empty}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-[1.5rem] border-border/40">
        <CardHeader>
          <CardTitle className="text-xl font-black">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
      {items.map((item) => (
        <Card key={item.id} className="rounded-[1.75rem] border-border/40">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-lg font-black">
                {format(new Date(item.createdAt), 'yyyy/MM/dd')}
              </CardTitle>
              <CardDescription>
                {t('partnership.panel.requestMeta', {
                  updatedAt: format(new Date(item.updatedAt), 'yyyy/MM/dd'),
                })}
              </CardDescription>
            </div>
            <Badge className={statusStyles[item.status as keyof typeof statusStyles]}>
              {t(`partnership.status.${item.status}`)}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderBody(item)}
            {item.notes ? (
              <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {t('partnership.panel.adminNote')}
                </div>
                <p className="mt-2 text-sm leading-7">{item.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
