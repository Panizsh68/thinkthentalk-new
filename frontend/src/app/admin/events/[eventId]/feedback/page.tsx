
'use client';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useToast } from '@/hooks/use-toast';
import { useAdminEventQuery } from '@/hooks/use-event-queries';
import { useEvaluationFormQuery, useSaveEvaluationFormMutation } from '@/hooks/use-evaluation-queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, PlusCircle, Trash2, GripVertical, Save, ArrowUp, ArrowDown } from 'lucide-react';
import { useEffect } from 'react';
import type { EvaluationQuestion } from '@/lib/types';
import { useParams } from 'next/navigation';


const getQuestionSchema = (t: (key: string) => string) => z.object({
  id: z.string().optional(),
  label: z.string().min(1, t('admin.feedback.validation.labelRequired')),
  type: z.enum(['RATING', 'TEXT']),
  required: z.boolean(),
});

const formSchema = (t: (key: string) => string) => z.object({
  questions: z.array(getQuestionSchema(t)),
});

type FormValues = z.infer<ReturnType<typeof formSchema>>;


export default function EventFeedbackFormBuilderPage() {
  const params = useParams<{ eventId: string }>();
  const { eventId } = params;
  const { t } = useLanguage();
  const { toast } = useToast();

  const { data: event, isLoading: isLoadingEvent, error: eventError } = useAdminEventQuery(eventId);
  const { data: evaluationForm, isLoading: isLoadingForm } = useEvaluationFormQuery(eventId, 'admin');
  const { mutate: saveForm, isPending: isSaving } = useSaveEvaluationFormMutation();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      questions: [],
    },
  });

  const { fields, append, remove, swap } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  useEffect(() => {
    if (evaluationForm?.questions) {
      form.reset({ questions: evaluationForm.questions });
    }
  }, [evaluationForm, form]);

  const onSubmit = (data: FormValues) => {
    if (!eventId) return;

    saveForm({ eventId, questions: data.questions }, {
        onSuccess: () => {
            toast({ title: t('admin.feedback.saveSuccessTitle'), description: t('admin.feedback.saveSuccessDescription') });
        },
        onError: (err) => {
            toast({ variant: 'destructive', title: t('errors.genericTitle'), description: err.message });
        }
    });
  };

  const isLoading = isLoadingEvent || isLoadingForm;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('admin.feedback.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('admin.feedback.subtitle', { eventName: event?.title || '...' })}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : eventError ? (
        <p className="text-destructive text-center">{t('errors.fetchEvent')}</p>
      ) : (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {fields.map((field, index) => (
                    <Card key={field.id} className="relative">
                        <CardHeader>
                            <CardTitle>{t('admin.feedback.questionNumber', { num: index + 1 })}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name={`questions.${index}.label`}
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>{t('admin.feedback.form.label')}</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`questions.${index}.type`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('admin.feedback.form.type')}</FormLabel>
                                         <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="RATING">{t('admin.feedback.types.rating')}</SelectItem>
                                                <SelectItem value="TEXT">{t('admin.feedback.types.text')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name={`questions.${index}.required`}
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <FormLabel>{t('admin.feedback.form.required')}</FormLabel>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <div className="flex gap-2">
                                 <Button type="button" variant="outline" size="icon" onClick={() => swap(index, index - 1)} disabled={index === 0}>
                                    <ArrowUp className="h-4 w-4" />
                                </Button>
                                 <Button type="button" variant="outline" size="icon" onClick={() => swap(index, index + 1)} disabled={index === fields.length - 1}>
                                    <ArrowDown className="h-4 w-4" />
                                </Button>
                            </div>
                            <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                                <Trash2 className="mr-2 h-4 w-4" /> {t('admin.feedback.deleteQuestion')}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}

                <div className="flex justify-between items-center">
                    <Button type="button" variant="outline" onClick={() => append({ label: '', type: 'RATING', required: true })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> {t('admin.feedback.addQuestion')}
                    </Button>
                     <Button type="submit" disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {t('admin.feedback.saveForm')}
                    </Button>
                </div>

            </form>
        </Form>
      )}
    </div>
  );
}
