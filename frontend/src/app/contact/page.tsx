'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Instagram, Send } from 'lucide-react';

import { useLanguage } from '@/lib/i18n/language-provider';
import { useAuth } from '@/lib/auth/auth-provider';
import { sendContactMessage } from '@/lib/api/contact';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const getContactSchema = (t: (key: string) => string) =>
  z.object({
    name: z
      .string({ required_error: t('contact.errors.nameInvalid') })
      .trim()
      .max(191, t('contact.errors.nameInvalid'))
      .optional()
      .or(z.literal('')),
    email: z.string().min(1, t('contact.errors.emailRequired')).email(t('contact.errors.emailInvalid')),
    message: z
      .string()
      .min(10, t('contact.errors.messageLength'))
      .max(5000, t('contact.errors.messageLength')),
    website: z.string().optional(),
  });

type ContactFormValues = z.infer<ReturnType<typeof getContactSchema>>;

export default function ContactPage() {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'rateLimit'>('idle');
  const [serverMessage, setServerMessage] = useState('');
  const [prefilled, setPrefilled] = useState(false);

  const schema = useMemo(() => getContactSchema(t), [t]);
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', message: '', website: '' },
  });

  const derivedName =
    currentUser &&
    [currentUser.firstNameEn ?? currentUser.firstNameFa, currentUser.lastNameEn ?? currentUser.lastNameFa]
      .filter(Boolean)
      .join(' ')
      .trim();

  useEffect(() => {
    if (currentUser) {
      if (derivedName) {
        form.setValue('name', derivedName);
      }
      if (currentUser.email) {
        form.setValue('email', currentUser.email);
      }
      setPrefilled(Boolean(derivedName || currentUser.email));
    } else {
      setPrefilled(false);
    }
  }, [currentUser, derivedName, form]);

  const onSubmit = async (values: ContactFormValues) => {
    setStatus('idle');
    setServerMessage('');
    try {
      const response = await sendContactMessage({
        name: values.name?.trim() || undefined,
        email: values.email.trim(),
        message: values.message.trim(),
        language,
        website: values.website,
      });
      setServerMessage(response?.message ?? t('contact.form.successMessage'));
      setStatus('success');
      form.reset({ name: '', email: '', message: '', website: '' });
      setPrefilled(false);
    } catch (error: any) {
      if (error?.status === 429) {
        setStatus('rateLimit');
        setServerMessage(t('contact.errors.rateLimit'));
        return;
      }
      setStatus('error');
      setServerMessage(error?.message ?? t('contact.errors.generic'));
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-16">
      <div className="space-y-4 text-center">
        <p className="text-sm uppercase tracking-wide text-primary">{t('contact.kicker')}</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('contact.title')}</h1>
        <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
          {t('contact.subtitle')}
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('contact.form.title')}</CardTitle>
            <CardDescription>{t('contact.form.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {prefilled && (
              <p className="mb-4 text-sm text-muted-foreground">
                {t('contact.form.prefilledNotice')}
              </p>
            )}
            <Form {...form}>
              <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contact.form.nameLabel')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('contact.form.namePlaceholder')} autoComplete="name" />
                      </FormControl>
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
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          inputMode="email"
                          placeholder="hello@example.com"
                          autoComplete="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contact.form.messageLabel')}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={6}
                          maxLength={5000}
                          placeholder={t('contact.form.messagePlaceholder')}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        {t('contact.form.messageHelper')}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="website">{t('contact.form.honeypotLabel')}</label>
                  <input id="website" type="text" tabIndex={-1} autoComplete="off" {...form.register('website')} />
                </div>

                <div aria-live="polite">
                  {(status === 'success' || status === 'error' || status === 'rateLimit') && (
                    <Alert variant={status === 'success' ? 'default' : 'destructive'}>
                      <AlertDescription>{serverMessage}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <Button className="w-full" type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('contact.form.submitLabel')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('contact.email.title')}</CardTitle>
              <CardDescription>{t('contact.email.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="mailto:thinkthentalk@gmail.com"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                thinkthentalk@gmail.com
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('contact.social.title')}</CardTitle>
              <CardDescription>{t('contact.social.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a
                href="https://instagram.com/thinkthentalk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-md border px-3 py-2 transition hover:bg-muted"
              >
                <Instagram className="h-5 w-5" />
                <span className="font-medium">{t('contact.social.instagram')}</span>
              </a>
              <a
                href="https://t.me/thinkthentalk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-md border px-3 py-2 transition hover:bg-muted"
              >
                <Send className="h-5 w-5" />
                <span className="font-medium">{t('contact.social.telegram')}</span>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
