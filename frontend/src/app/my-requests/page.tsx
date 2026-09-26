'use client';

import { useEffect, type ElementType, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Briefcase, Building2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-provider';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useMyCollaborationsQuery, useMySponsorshipsQuery } from '@/hooks/use-partnership-queries';
import { formatLocalizedDate } from '@/lib/format-date';
import type { ApiError } from '@/lib/api/client';
import type { CollaborationUserRequest, SponsorshipUserRequest } from '@/lib/types';

const statusStyles = {
  PENDING: 'bg-amber-100 text-amber-900 border-amber-200',
  REVIEWING: 'bg-sky-100 text-sky-900 border-sky-200',
  CONTACTED: 'bg-violet-100 text-violet-900 border-violet-200',
  ACCEPTED: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-900 border-rose-200',
} as const;

type Translate = (key: string, options?: Record<string, unknown>) => string;

const getErrorStatus = (error: unknown): number | undefined => {
  return error instanceof Error ? (error as ApiError).status : undefined;
};
const isNetworkError = (error: unknown): boolean => error instanceof Error && Boolean((error as ApiError).isNetworkError);

export default function MyRequestsPage() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const {
    data: collaborations,
    isLoading: loadingCollaborations,
    error: collaborationsError,
    refetch: refetchCollaborations,
  } = useMyCollaborationsQuery(Boolean(currentUser));
  const {
    data: sponsorships,
    isLoading: loadingSponsorships,
    error: sponsorshipsError,
    refetch: refetchSponsorships,
  } = useMySponsorshipsQuery(Boolean(currentUser));

  useEffect(() => {
    if (!isAuthLoading && !currentUser) {
      router.replace(`/login?redirect=${encodeURIComponent('/my-requests')}`);
    }
  }, [currentUser, isAuthLoading, router]);

  if (isAuthLoading || !currentUser) {
    return <LoadingState label={t('actions.loading')} />;
  }

  const requestError = collaborationsError || sponsorshipsError;
  if (requestError) {
    const isForbidden = getErrorStatus(requestError) === 403;
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center text-destructive" role="alert">
        <AlertTriangle className="h-8 w-8" />
        <p>{isForbidden ? t('partnership.panel.forbidden') : getErrorStatus(requestError) === 401 ? t('partnership.panel.unauthorized') : isNetworkError(requestError) ? t('partnership.panel.networkError') : t('partnership.panel.serverError')}</p>
        <Button onClick={() => { void refetchCollaborations(); void refetchSponsorships(); }} variant="outline">{t('actions.retry')}</Button>
      </div>
    );
  }

  if (loadingCollaborations || loadingSponsorships) {
    return <LoadingState label={t('partnership.panel.loading')} />;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-primary/15 bg-primary/5 p-6 md:p-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight">{t('partnership.panel.title')}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">{t('partnership.panel.description')}</p>
        </div>
      </section>

      <Tabs defaultValue="collaborations" className="w-full">
        <TabsList className="mb-6 h-auto rounded-2xl bg-muted/60 p-1">
          <TabsTrigger value="collaborations" className="rounded-xl px-5 py-2.5 font-bold">{t('partnership.panel.tabs.collaborations')}</TabsTrigger>
          <TabsTrigger value="sponsorships" className="rounded-xl px-5 py-2.5 font-bold">{t('partnership.panel.tabs.sponsorships')}</TabsTrigger>
        </TabsList>

        <TabsContent value="collaborations" className="mt-0">
          <RequestSection<CollaborationUserRequest>
            title={t('partnership.panel.collaborationsTitle')}
            description={t('partnership.panel.collaborationsDescription')}
            empty={t('partnership.panel.emptyCollaborations')}
            icon={Briefcase}
            items={collaborations ?? []}
            language={language}
            renderBody={(item) => (
              <div className="space-y-3">
                <DetailRow label={t('collaborate.form.expertise')} value={item.fieldOfExpertise} />
                <DetailRow label={t('collaborate.form.whyJoin')} value={item.whyJoin} preserveWhitespace />
                <DetailRow label={t('collaborate.form.experience')} value={item.experience || t('registration.summary.noInfo')} preserveWhitespace />
                <DetailRow label={t('collaborate.form.availability')} value={item.availability || t('registration.summary.noInfo')} />
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <DetailRow label={t('contact.form.nameLabel')} value={`${item.firstName} ${item.lastName}`} />
                  <DetailRow label={t('contact.form.emailLabel')} value={item.email} />
                  <DetailRow label={t('auth.mobileLabel')} value={item.mobile} />
                  <DetailRow label={t('collaborate.form.termsStatus')} value={item.acceptedTerms ? t('collaborate.form.accepted') : t('collaborate.form.notAccepted')} />
                </div>
              </div>
            )}
            t={t}
          />
        </TabsContent>

        <TabsContent value="sponsorships" className="mt-0">
          <RequestSection<SponsorshipUserRequest>
            title={t('partnership.panel.sponsorshipsTitle')}
            description={t('partnership.panel.sponsorshipsDescription')}
            empty={t('partnership.panel.emptySponsorships')}
            icon={Building2}
            items={sponsorships ?? []}
            language={language}
            renderBody={(item) => (
              <div className="space-y-3">
                <DetailRow label={t('sponsorship.form.companyLabel')} value={item.companyName} />
                <DetailRow label={t('sponsorship.form.nameLabel')} value={item.representativeName} />
                <DetailRow label={t('contact.form.emailLabel')} value={item.email} />
                <DetailRow label={t('auth.mobileLabel')} value={item.mobile} />
                <DetailRow label={t('sponsorship.form.planLabel')} value={t(`sponsorship.plans.${item.plan}.name`)} />
                <DetailRow label={t('sponsorship.form.notes')} value={item.description || t('registration.summary.noInfo')} preserveWhitespace />
              </div>
            )}
            t={t}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return <div className="flex items-center justify-center gap-3 py-24" role="status"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="sr-only">{label}</span></div>;
}

function DetailRow({ label, value, preserveWhitespace = false }: { label: string; value: string; preserveWhitespace?: boolean }) {
  return <div className="space-y-1"><div className="text-xs font-semibold text-muted-foreground">{label}</div><div className={preserveWhitespace ? 'whitespace-pre-wrap text-sm leading-7' : 'text-sm'}>{value}</div></div>;
}

function RequestSection<T extends { id: string; status: keyof typeof statusStyles; createdAt: string; updatedAt: string; history?: Array<{ id: string; fromStatus: string | null; toStatus: string; note: string | null; createdAt: string }> }>({
  title,
  description,
  empty,
  icon: Icon,
  items,
  renderBody,
  language,
  t,
}: {
  title: string;
  description: string;
  empty: string;
  icon: ElementType;
  items: T[];
  renderBody: (item: T) => ReactNode;
  language: 'fa' | 'en';
  t: Translate;
}) {
  if (!items.length) {
    return <Card className="rounded-[2rem] border-border/40"><CardContent className="py-20 text-center"><Icon className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" /><p className="font-medium text-muted-foreground">{empty}</p></CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-[1.5rem] border-border/40"><CardHeader><CardTitle className="text-xl font-black">{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader></Card>
      {items.map((item) => (
        <Card key={item.id} className="rounded-[1.75rem] border-border/40">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2"><CardTitle className="text-lg font-black">{formatLocalizedDate(item.createdAt, language)}</CardTitle><CardDescription>{t('partnership.panel.requestMeta', { updatedAt: formatLocalizedDate(item.updatedAt, language, true) })}</CardDescription></div>
            <Badge className={statusStyles[item.status]}>{t(`partnership.status.${item.status}`)}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderBody(item)}
            {item.history?.length ? <div className="rounded-2xl border border-border/50 bg-muted/20 p-4"><div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{t('partnership.panel.statusHistory')}</div><div className="mt-3 space-y-3">{item.history.map((history) => <div key={history.id} className="flex items-start justify-between gap-3 text-sm"><div className="min-w-0"><div>{history.fromStatus ? `${t(`partnership.status.${history.fromStatus}`)} → ` : ''}{t(`partnership.status.${history.toStatus}`)}</div>{history.note ? <div className="mt-1 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-sm leading-6 text-foreground"><span className="font-semibold">{t('partnership.panel.statusMessage')}:</span> {history.note}</div> : null}</div><span className="shrink-0 text-xs text-muted-foreground">{formatLocalizedDate(history.createdAt, language, true)}</span></div>)}</div></div> : null}
            <div className="grid gap-3 border-t pt-4 text-xs text-muted-foreground sm:grid-cols-2"><span>{t('partnership.panel.submittedAt')}: {formatLocalizedDate(item.createdAt, language, true)}</span><span>{t('partnership.panel.processedAt')}: {formatLocalizedDate((item as T & { processedAt?: string | null }).processedAt, language, true)}</span></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
