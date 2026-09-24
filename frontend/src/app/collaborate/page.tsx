'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useAuth } from '@/lib/auth/auth-provider';
import { useSubmitCollabMutation } from '@/hooks/use-partnership-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Users, Heart, ClipboardCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { normalizeIranianMobile, trimOptional } from '@/lib/partnership/normalization';
import type { ApiError } from '@/lib/api/client';

type Translate = (key: string, options?: Record<string, unknown>) => string;

const getCollabSchema = (t: Translate) => z.object({
  firstName: z.string().trim().min(1, t('registration.validation.required')).max(100, t('collaborate.validation.nameTooLong')),
  lastName: z.string().trim().min(1, t('registration.validation.required')).max(100, t('collaborate.validation.nameTooLong')),
  email: z.string().trim().min(1, t('registration.validation.required')).email(t('contact.errors.emailInvalid')).max(255, t('collaborate.validation.emailTooLong')),
  mobile: z.string().trim().transform(normalizeIranianMobile).refine((value) => /^09\d{9}$/.test(value), t('auth.errors.invalidMobile')),
  fieldOfExpertise: z.string().trim().min(1, t('registration.validation.required')).max(200, t('collaborate.validation.expertiseTooLong')),
  experience: z.string().transform(trimOptional).refine((value) => !value || value.length <= 5000, t('collaborate.validation.experienceTooLong')),
  whyJoin: z.string().trim().min(1, t('registration.validation.required')).max(5000, t('collaborate.validation.whyJoinTooLong')),
  availability: z.string().transform(trimOptional).refine((value) => !value || value.length <= 500, t('collaborate.validation.availabilityTooLong')),
  acceptedTerms: z.boolean().refine((value) => value === true, { message: t('registration.validation.rulesRequired') }),
});

const isPlaceholder = (value?: string | null) => {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return ['نام', 'نام خانوادگی', 'name', 'first name', 'last name'].includes(normalized);
};

const getErrorStatus = (error: unknown): number | undefined => {
  return error instanceof Error ? (error as ApiError).status : undefined;
};

const getServerMessages = (error: unknown): string[] => {
  if (!(error instanceof Error)) return [];
  const data = (error as ApiError).data;
  if (!data || typeof data !== 'object' || !('message' in data)) return [];
  const message = (data as { message?: unknown }).message;
  return Array.isArray(message) ? message.filter((item): item is string => typeof item === 'string') : [];
};

export default function CollaboratePage() {
  const { t } = useLanguage();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const { mutate: submit, isPending } = useSubmitCollabMutation();
  const schema = getCollabSchema(t);
  type FormValues = z.input<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      fieldOfExpertise: '',
      experience: '',
      whyJoin: '',
      availability: '',
      acceptedTerms: false,
    },
  });

  useEffect(() => {
    if (!currentUser) return;

    const dirtyFields = form.formState.dirtyFields;
    if (!dirtyFields.firstName) form.setValue('firstName', isPlaceholder(currentUser.firstNameFa) ? '' : currentUser.firstNameFa, { shouldDirty: false, shouldValidate: false });
    if (!dirtyFields.lastName) form.setValue('lastName', isPlaceholder(currentUser.lastNameFa) ? '' : currentUser.lastNameFa, { shouldDirty: false, shouldValidate: false });
    if (!dirtyFields.email) form.setValue('email', currentUser.email || '', { shouldDirty: false, shouldValidate: false });
    if (!dirtyFields.mobile) form.setValue('mobile', currentUser.mobile || '', { shouldDirty: false, shouldValidate: false });
  }, [currentUser, form]);

  const onSubmit = (values: z.output<typeof schema>) => {
    submit({ ...values, acceptedTerms: true }, {
      onSuccess: () => {
        setStep(3);
        toast({ title: t('collaborate.successTitle') });
      },
      onError: (error: unknown) => {
        const status = getErrorStatus(error);
        if (status === 400) {
          const serverMessages = getServerMessages(error);
          const fields = ['firstName', 'lastName', 'email', 'mobile', 'fieldOfExpertise', 'experience', 'whyJoin', 'availability', 'acceptedTerms'] as const;
          fields.forEach((field) => {
            if (serverMessages.some((message) => message.toLowerCase().includes(field.toLowerCase()))) {
              form.setError(field, { type: 'server', message: t('collaborate.errors.validation') });
            }
          });
        }
        const message = status === 400
          ? t('collaborate.errors.validation')
          : status === 401
            ? t('collaborate.errors.unauthorized')
            : status === 403
              ? t('collaborate.errors.forbidden')
              : status === 409
                ? t('collaborate.errors.duplicate')
                : status && status >= 500
                  ? t('collaborate.errors.server')
                  : t('collaborate.errors.network');
        toast({ variant: 'destructive', title: message });
      },
    });
  };

  if (isAuthLoading) {
    return <div className="flex items-center justify-center py-24" role="status" aria-label={t('actions.loading')}><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!currentUser) {
    return (
      <div className="container max-w-2xl px-4 py-20">
        <Card className="rounded-[2rem] border-none shadow-xl">
          <CardHeader className="text-center">
            <CardTitle>{t('collaborate.panel.loginTitle')}</CardTitle>
            <CardDescription>{t('collaborate.panel.loginDescription')}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="h-12 w-full rounded-xl font-bold">
              <Link href={`/login?redirect=${encodeURIComponent('/collaborate')}`}>{t('auth.loginButton')}</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="container max-w-3xl px-4 py-16">
        <div className="mb-10 text-center">
          <Users className="mx-auto mb-4 h-16 w-16 text-primary" />
          <h1 className="text-3xl font-bold">{t('collaborate.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('collaborate.subtitle')}</p>
        </div>
        <Card className="rounded-[2rem] border-none shadow-lg">
          <CardHeader><CardTitle>{t('collaborate.terms.title')}</CardTitle></CardHeader>
          <CardContent className="prose max-w-none dark:prose-invert">
            <div dangerouslySetInnerHTML={{ __html: t('collaborate.terms.content') }} />
          </CardContent>
          <CardFooter>
            <Button className="h-12 w-full rounded-xl font-bold" onClick={() => setStep(2)}>
              {t('collaborate.actions.readAndContinue')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="container max-w-2xl px-4 py-20 text-center">
        <Heart className="mx-auto mb-6 h-20 w-20 animate-pulse text-red-500" />
        <h1 className="mb-4 text-3xl font-bold">{t('collaborate.successTitle')}</h1>
        <p className="mb-8 text-lg leading-relaxed text-muted-foreground">{t('collaborate.successDescription')}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="rounded-full font-bold"><Link href="/my-requests">{t('partnership.panel.navLabel')}</Link></Button>
          <Button asChild size="lg" variant="outline" className="rounded-full font-bold"><Link href="/dashboard">{t('actions.backToDashboard')}</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl px-4 py-16">
      <Card className="rounded-[2.5rem] border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-6 w-6 text-primary" />{t('collaborate.form.title')}</CardTitle>
          <CardDescription>{t('collaborate.form.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField control={form.control} name="firstName" render={({ field }) => <FormItem><FormLabel>{t('registration.fields.firstNameFa')} *</FormLabel><FormControl><Input autoComplete="given-name" placeholder={t('collaborate.form.firstNamePlaceholder')} {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="lastName" render={({ field }) => <FormItem><FormLabel>{t('registration.fields.lastNameFa')} *</FormLabel><FormControl><Input autoComplete="family-name" placeholder={t('collaborate.form.lastNamePlaceholder')} {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>{t('contact.form.emailLabel')} *</FormLabel><FormControl><Input dir="ltr" type="email" autoComplete="email" placeholder="name@example.com" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="mobile" render={({ field }) => <FormItem><FormLabel>{t('auth.mobileLabel')} *</FormLabel><FormControl><Input dir="ltr" type="tel" autoComplete="tel" inputMode="tel" placeholder={t('collaborate.form.mobilePlaceholder')} {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="fieldOfExpertise" render={({ field }) => <FormItem><FormLabel>{t('collaborate.form.expertise')} *</FormLabel><FormControl><Input placeholder={t('collaborate.form.expertisePlaceholder')} {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>} />
              </div>

              <FormField control={form.control} name="experience" render={({ field }) => <FormItem><FormLabel>{t('collaborate.form.experience')} <span className="font-normal text-muted-foreground">({t('collaborate.form.optional')})</span></FormLabel><FormDescription>{t('collaborate.form.experienceHelp')}</FormDescription><FormControl><Textarea rows={3} placeholder={t('collaborate.form.experiencePlaceholder')} {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="whyJoin" render={({ field }) => <FormItem><FormLabel>{t('collaborate.form.whyJoin')} *</FormLabel><FormControl><Textarea rows={4} placeholder={t('collaborate.form.whyJoinPlaceholder')} {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="availability" render={({ field }) => <FormItem><FormLabel>{t('collaborate.form.availability')} <span className="font-normal text-muted-foreground">({t('collaborate.form.optional')})</span></FormLabel><FormDescription>{t('collaborate.form.availabilityHelp')}</FormDescription><FormControl><Input placeholder={t('collaborate.form.availabilityPlaceholder')} {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>} />

              <FormField control={form.control} name="acceptedTerms" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4">
                  <FormControl><Checkbox id="acceptedTerms" checked={field.value} onCheckedChange={field.onChange} aria-describedby="acceptedTerms-description" /></FormControl>
                  <div className="space-y-1 leading-none"><FormLabel htmlFor="acceptedTerms">{t('collaborate.form.acceptTerms')} *</FormLabel><p id="acceptedTerms-description" className="text-xs text-muted-foreground">{t('collaborate.form.acceptTermsHelp')}</p><FormMessage /></div>
                </FormItem>
              )} />

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" className="rounded-xl font-bold" onClick={() => setStep(1)}>{t('actions.back')}</Button>
                <Button type="submit" className="h-12 flex-1 rounded-xl font-bold shadow-md" disabled={isPending} aria-disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('collaborate.form.submit')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
