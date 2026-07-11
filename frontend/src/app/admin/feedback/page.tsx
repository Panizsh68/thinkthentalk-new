
'use client';
import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { enUS, faIR } from 'date-fns/locale';
import { useAdminEventsQuery } from '@/hooks/use-event-queries';
import { useEvaluationResponsesQuery } from '@/hooks/use-evaluation-queries';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { EvaluationResponse } from '@/lib/types';
import { Star, Loader2, BarChart2, Hash, StarHalf } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getLocalizedTextValue } from '@/lib/i18n/get-localized-text';
import { cn } from '@/lib/utils';
import { getTextDirection } from '@/lib/text/direction';

function StarRating({ rating, size = 4 }: { rating: number, size?: number }) {
    const starSizeClass = size >= 5 ? 'h-5 w-5' : 'h-4 w-4';
    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    starSizeClass,
                    i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30',
                  )}
                />
            ))}
        </div>
    )
}

function calculateSummary(responses: EvaluationResponse[]) {
    if (!responses || responses.length === 0) {
        return { responseCount: 0, averageRatings: {} };
    }

    const ratingQuestions: Record<string, { total: number, count: number }> = {};
    
    responses.forEach(res => {
        res.questions.forEach(q => {
            if (q.type === 'RATING') {
                if (!ratingQuestions[q.id]) {
                    ratingQuestions[q.id] = { total: 0, count: 0 };
                }
                const answer = res.submission.answers[q.id];
                if (typeof answer === 'number') {
                    ratingQuestions[q.id].total += answer;
                    ratingQuestions[q.id].count++;
                }
            }
        })
    });

    const averageRatings: Record<string, { label: string, average: number }> = {};
    Object.keys(ratingQuestions).forEach(qId => {
        const question = responses[0]?.questions.find(q => q.id === qId);
        if (question) {
            const { total, count } = ratingQuestions[qId];
            averageRatings[qId] = {
                label: question.label,
                average: count > 0 ? total / count : 0
            };
        }
    });

    return { responseCount: responses.length, averageRatings };
}


export default function AdminFeedbackPage() {
  const { t, language } = useLanguage();
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  
  const { data: events, isLoading: isLoadingEvents } = useAdminEventsQuery({});
  const { data: responses, isLoading: isLoadingResponses } = useEvaluationResponsesQuery(selectedEventId);

  const summary = useMemo(() => calculateSummary(responses || []), [responses]);
  const dateLocale = language === 'fa' ? faIR : enUS;
  const isRTL = language === 'fa';

  useEffect(() => {
    if (!selectedEventId && events?.length) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  return (
    <div className={cn('space-y-6', isRTL && 'text-right')} dir={isRTL ? 'rtl' : 'ltr'}>
       <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{t('admin.feedback.results.title')}</h1>
        <p className="text-muted-foreground">{t('admin.feedback.results.subtitle')}</p>
      </div>

      <Card dir={isRTL ? 'rtl' : 'ltr'} className="border-border/60 shadow-sm">
        <CardHeader className={cn(isRTL && 'text-right')}>
            <CardTitle>{t('admin.feedback.results.selectEvent')}</CardTitle>
        </CardHeader>
        <CardContent>
            <Select value={selectedEventId} onValueChange={setSelectedEventId} disabled={isLoadingEvents || !events?.length}>
                <SelectTrigger className="w-full md:w-1/2 lg:w-1/3">
                    <SelectValue placeholder={t('admin.registrations.filters.eventPlaceholder')} />
                </SelectTrigger>
                <SelectContent dir={isRTL ? 'rtl' : 'ltr'}>
                     {events?.map((event) => {
                        const eventLabel = getLocalizedTextValue(event.title, language);
                        return (
                        <SelectItem key={event.id} value={event.id}>
                            {eventLabel}
                        </SelectItem>
                    )})}
                </SelectContent>
            </Select>
        </CardContent>
      </Card>

      {isLoadingResponses && selectedEventId && (
        <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {responses && selectedEventId && (
        <div className="space-y-6">
            <Card dir={isRTL ? 'rtl' : 'ltr'} className="border-border/60 shadow-sm">
                <CardHeader className={cn(isRTL && 'text-right')}>
                    <CardTitle>{t('admin.feedback.results.summaryTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className={cn('flex items-center gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4', isRTL && 'flex-row-reverse')}>
                        <Hash className="h-8 w-8 text-primary" />
                        <div>
                            <p className="text-muted-foreground">{t('admin.feedback.results.totalResponses')}</p>
                            <p className="text-2xl font-bold">{summary.responseCount}</p>
                        </div>
                    </div>
                    {Object.entries(summary.averageRatings).map(([qId, data]) => (
                         <div key={qId} className={cn('flex items-center gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4', isRTL && 'flex-row-reverse')}>
                            <StarHalf className="h-8 w-8 text-yellow-500" />
                            <div>
                                <p
                                  className="text-muted-foreground truncate"
                                  title={data.label}
                                  dir={getTextDirection(data.label)}
                                >
                                  {data.label}
                                </p>
                                <p className="text-2xl font-bold">{data.average.toFixed(2)} / 5</p>
                            </div>
                         </div>
                    ))}
                </CardContent>
            </Card>

            <div>
                <h2 className="text-xl font-bold mb-4">{t('admin.feedback.results.individualResponses')}</h2>
                <div className="space-y-4">
                    {responses.map(res => (
                        <Card key={res.submission.id} dir={isRTL ? 'rtl' : 'ltr'} className="border-border/60 shadow-sm">
                            <CardHeader className={cn(isRTL && 'text-right')}>
                                <CardTitle className="text-base" dir={getTextDirection(res.user.name)}>{res.user.name}</CardTitle>
                                <CardDescription>{format(new Date(res.submission.submittedAt), 'PPp', { locale: dateLocale })}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {res.questions.map(q => {
                                    const answer = res.submission.answers[q.id];
                                    if (answer === undefined || answer === null || answer === '') return null;
                                    return (
                                        <div key={q.id} className="space-y-2 rounded-xl border border-border/60 bg-muted/10 p-4">
                                            <p className="font-semibold" dir={getTextDirection(q.label)}>{q.label}</p>
                                            {q.type === 'RATING' ? (
                                                <div className="flex items-center gap-2">
                                                    <StarRating rating={Number(answer)} /> 
                                                    <span className="text-muted-foreground text-sm">({answer}/5)</span>
                                                </div>
                                            ) : (
                                                <p
                                                  className={cn(
                                                    'mt-1 border-l-2 border-border pl-4 text-muted-foreground',
                                                    isRTL && 'border-l-0 border-r-2 pr-4 pl-0 text-right',
                                                  )}
                                                  dir="auto"
                                                >
                                                    {q.type === 'YES_NO'
                                                      ? ((typeof answer === 'boolean' ? answer : String(answer).toLowerCase() === 'true')
                                                        ? t('actions.yes')
                                                        : t('actions.no'))
                                                      : String(answer)}
                                                </p>
                                            )}
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
      )}

      {!isLoadingResponses && selectedEventId && !responses?.length && (
         <div className={cn('text-center text-muted-foreground py-16', isRTL && 'text-right')}>
            <BarChart2 className="h-12 w-12 mx-auto mb-4" />
            <p>{t('admin.feedback.results.noResponses')}</p>
        </div>
      )}
    </div>
  );
}
