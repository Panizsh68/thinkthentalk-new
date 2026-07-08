'use client';

import Link from 'next/link';
import { AlertTriangle, Lightbulb, Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns-jalali';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useAuth } from '@/lib/auth/auth-provider';
import { useMyIdeasQuery } from '@/hooks/use-event-idea-queries';

const statusStyles = {
  PENDING: 'bg-amber-100 text-amber-900 border-amber-200',
  REVIEWED: 'bg-sky-100 text-sky-900 border-sky-200',
  PLANNED: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-900 border-rose-200',
} as const;

export default function MyIdeasPage() {
  const { t } = useLanguage();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const { data, isLoading, error, refetch } = useMyIdeasQuery(!!currentUser);

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
        <p>{t('ideas.panel.loadError')}</p>
        <Button onClick={() => refetch()} variant="outline">
          {t('actions.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-primary/15 bg-primary/5 p-6 md:p-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight">{t('ideas.panel.title')}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            {t('ideas.panel.description')}
          </p>
        </div>
      </section>

      {!data || data.length === 0 ? (
        <Card className="rounded-[2rem] border-border/40">
          <CardContent className="py-20 text-center">
            <Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">{t('ideas.panel.empty')}</p>
            <Button asChild className="mt-5 rounded-xl font-bold">
              <Link href="/ideas">{t('ideas.panel.submitNew')}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {data.map((idea) => (
            <Card key={idea.id} className="rounded-[1.75rem] border-border/40">
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl font-black">{idea.title}</CardTitle>
                  </div>
                  <CardDescription>
                    {t(`ideas.types.${idea.type}`)} • {format(new Date(idea.createdAt), 'yyyy/MM/dd')}
                  </CardDescription>
                </div>
                <Badge className={statusStyles[idea.status]}>
                  {t(`ideas.status.${idea.status}`)}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-7 text-foreground/85">{idea.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
