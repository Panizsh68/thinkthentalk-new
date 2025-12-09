
'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useAuth } from '@/lib/auth/auth-provider';
import { useUserRegistrationsQuery } from '@/hooks/use-registration-queries';
import { useEventQuery } from '@/hooks/use-event-queries';
import { useEvaluationFormQuery, useSubmitEvaluationMutation } from '@/hooks/use-evaluation-queries';
import { Loader2, AlertTriangle, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { isEventPast } from '@/lib/event-helpers';
import type { EvaluationQuestion } from '@/lib/types';
import { useParams } from 'next/navigation';


export default function EvaluationPage() {
  const { t } = useLanguage();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const params = useParams<{ id: string }>();
  const eventId = params.id;

  const { data: event, isLoading: isLoadingEvent } = useEventQuery(eventId);
  const { data: registrations, isLoading: isLoadingRegistrations } = useUserRegistrationsQuery(currentUser?.id);
  const { data: evaluation, isLoading: isLoadingEvaluation, error: evaluationError } = useEvaluationFormQuery(eventId, currentUser?.id);
  const { mutate: submitEvaluation, isPending: isSubmitting } = useSubmitEvaluationMutation();

  const isLoading = isAuthLoading || isLoadingEvent || isLoadingRegistrations || isLoadingEvaluation;

  const registration = registrations?.find(reg => reg.eventId === eventId && reg.status === 'PAID');
  const eventHasPassed = event ? isEventPast(event) : false;

  const generateSchema = (questions: EvaluationQuestion[]) => {
    const schemaShape: { [key: string]: z.ZodType<any, any> } = {};
    questions.forEach(q => {
      let fieldSchema;
      if (q.type === 'RATING') {
        fieldSchema = z.coerce.number().min(1).max(5);
      } else {
        fieldSchema = z.string();
      }

      if (q.required) {
        fieldSchema = fieldSchema.min(1, t('evaluation.validation.required'));
      } else {
        fieldSchema = fieldSchema.optional();
      }
      schemaShape[q.id] = fieldSchema;
    });
    return z.object(schemaShape);
  };
  
  const form = useForm({
    resolver: evaluation?.questions ? zodResolver(generateSchema(evaluation.questions)) : undefined,
  });

  const onSubmit = (data: any) => {
    if (!evaluation || !currentUser) return;
    submitEvaluation({
        evaluationId: evaluation.id,
        answers: data,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container py-20 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold">{t('evaluation.errors.notAuthenticated')}</h1>
        <p className="text-muted-foreground">{t('evaluation.errors.loginPrompt')}</p>
        <Button asChild className="mt-4"><Link href={`/login?redirect=/events/${eventId}/evaluation`}>{t('actions.login')}</Link></Button>
      </div>
    );
  }
  
  if (evaluation?.submitted) {
    return (
        <div className="container py-20 flex flex-col items-center text-center gap-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h1 className="text-2xl font-bold">{t('evaluation.alreadySubmittedTitle')}</h1>
            <p className="text-muted-foreground">{t('evaluation.alreadySubmittedDescription')}</p>
            <Button asChild>
                <Link href="/dashboard">{t('actions.backToDashboard')}</Link>
            </Button>
        </div>
    );
  }

  if (!registration || !eventHasPassed) {
     return (
      <div className="container py-20 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold">{t('evaluation.errors.notEligibleTitle')}</h1>
        <p className="text-muted-foreground max-w-md mx-auto">{t('evaluation.errors.notEligibleDescription')}</p>
        <Button asChild className="mt-4"><Link href={`/events/${eventId}`}>{t('actions.backToEvents')}</Link></Button>
      </div>
    );
  }
  
  if (evaluationError || !evaluation || evaluation.questions.length === 0) {
     return (
      <div className="container py-20 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <p>{(evaluationError as any)?.message || t('evaluation.errors.formNotFound')}</p>
      </div>
    );
  }

  return (
    <div className="container py-12">
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle className="text-h2">{t('evaluation.title')}</CardTitle>
                <CardDescription>{t('evaluation.subtitle', { eventName: event?.title })}</CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-8">
                        {evaluation.questions.map((question, index) => (
                           <div key={question.id}>
                             <FormField
                                control={form.control}
                                name={question.id}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base">
                                            {index + 1}. {question.label} {question.required && '*'}
                                        </FormLabel>
                                        <FormControl>
                                            {question.type === 'RATING' ? (
                                                <Controller
                                                    name={question.id}
                                                    control={form.control}
                                                    render={({ field: controllerField }) => (
                                                        <RadioGroup
                                                          onValueChange={(val) => controllerField.onChange(parseInt(val, 10))}
                                                          value={String(controllerField.value || '')}
                                                          className="flex items-center gap-4 pt-2"
                                                        >
                                                            {[1,2,3,4,5].map(v => (
                                                                <FormItem key={v} className="flex flex-col items-center space-y-1">
                                                                    <FormControl>
                                                                        <RadioGroupItem value={String(v)} id={`${question.id}-${v}`} />
                                                                    </FormControl>
                                                                    <FormLabel htmlFor={`${question.id}-${v}`} className="font-normal text-sm">{v}</FormLabel>
                                                                </FormItem>
                                                            ))}
                                                        </RadioGroup>
                                                    )}
                                                />
                                            ) : (
                                                <Textarea
                                                    placeholder={t('evaluation.textPlaceholder')}
                                                    {...field}
                                                />
                                            )}
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                             />
                           </div>
                        ))}
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             <Send className="mr-2 h-4 w-4" />
                            {t('actions.submitFeedback')}
                         </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    </div>
  );
}
