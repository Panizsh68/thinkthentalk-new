'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useAuth } from '@/lib/auth/auth-provider';
import { useSubmitIdeaMutation } from '@/hooks/use-event-idea-queries';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Lightbulb } from 'lucide-react';

const getIdeaSchema = (t: any) => z.object({
  name: z.string().optional(),
  email: z.string().email(t('contact.errors.emailInvalid')).optional().or(z.literal('')),
  title: z.string().min(1, t('registration.validation.required')),
  description: z.string().min(1, t('registration.validation.required')),
  type: z.enum(['TOPIC', 'FORMAT', 'VENUE', 'OTHER']),
});

type IdeaFormValues = z.infer<ReturnType<typeof getIdeaSchema>>;

export default function SubmitIdeaPage() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { mutate: submitIdea, isPending } = useSubmitIdeaMutation();
  const [submittedIdea, setSubmittedIdea] = useState<IdeaFormValues | null>(null);

  const form = useForm<IdeaFormValues>({
    resolver: zodResolver(getIdeaSchema(t)),
    defaultValues: {
      name: '',
      email: '',
      title: '',
      description: '',
      type: 'TOPIC',
    },
  });

  const onSubmit = (values: IdeaFormValues) => {
    submitIdea(values, {
      onSuccess: () => {
        setSubmittedIdea(values);
        toast({
          title: t('ideas.successTitle'),
          description: t('ideas.successDescription'),
        });
        form.reset();
      },
      onError: (error: any) => {
        toast({
          variant: 'destructive',
          title: t('errors.genericTitle'),
          description: error.message,
        });
      },
    });
  };

  if (submittedIdea) {
    return (
      <div className="container max-w-2xl py-20 text-center px-4">
        <Lightbulb className="mx-auto mb-6 h-20 w-20 text-primary" />
        <h1 className="mb-4 text-3xl font-bold">{t('ideas.successTitle')}</h1>
        <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
          {t('ideas.successDescription')}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {currentUser ? (
            <Button asChild size="lg" className="rounded-full font-bold">
              <Link href="/my-ideas">{t('ideas.panel.navLabel')}</Link>
            </Button>
          ) : null}
          <Button
            size="lg"
            variant="outline"
            className="rounded-full font-bold"
            onClick={() => setSubmittedIdea(null)}
          >
            {t('ideas.panel.submitNew')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-12 px-4">
      <div className="text-center mb-8 space-y-2">
        <Lightbulb className="h-12 w-12 text-primary mx-auto" />
        <h1 className="text-3xl font-bold">Think Then Talk Ideas</h1>
        <p className="text-muted-foreground">{t('ideas.subtitle')}</p>
      </div>

      <Card className="rounded-[2rem] border-none shadow-lg">
        <CardHeader>
          <CardTitle>{t('ideas.form.title')}</CardTitle>
          <CardDescription>{t('ideas.form.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {!currentUser && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('contact.form.nameLabel')}</FormLabel>
                        <FormControl><Input {...field} className="rounded-xl" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('contact.form.emailLabel')}</FormLabel>
                        <FormControl><Input dir="ltr" {...field} className="rounded-xl" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('ideas.form.typeLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="TOPIC">{t('ideas.types.TOPIC')}</SelectItem>
                        <SelectItem value="FORMAT">{t('ideas.types.FORMAT')}</SelectItem>
                        <SelectItem value="VENUE">{t('ideas.types.VENUE')}</SelectItem>
                        <SelectItem value="OTHER">{t('ideas.types.OTHER')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('ideas.form.titleLabel')}</FormLabel>
                    <FormControl><Input {...field} className="rounded-xl" placeholder={t('ideas.form.titlePlaceholder')} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('ideas.form.descriptionLabel')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={6} className="rounded-xl" placeholder={t('ideas.form.descriptionPlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-12 rounded-xl font-bold shadow-md" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('ideas.form.submitButton')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
