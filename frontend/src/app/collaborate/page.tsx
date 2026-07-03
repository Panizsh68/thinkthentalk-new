'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useAuth } from '@/lib/auth/auth-provider';
import { useSubmitCollabMutation } from '@/hooks/use-partnership-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Users, Heart, ClipboardCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const getCollabSchema = (t: any) => z.object({
  name: z.string().min(2, t('registration.validation.required')),
  email: z.string().email(t('contact.errors.emailInvalid')),
  mobile: z.string().regex(/^09\d{9}$/, t('auth.errors.invalidMobile')),
  fieldOfExpertise: z.string().min(2, t('registration.validation.required')),
  experience: z.string().optional(),
  whyJoin: z.string().min(20, t('ideas.validation.descriptionLength')),
  availability: z.string().optional(),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: t('registration.validation.rulesRequired') }),
  }),
});

const isPlaceholder = (val?: string | null) => {
  if (!val) return true;
  const normalized = val.trim().toLowerCase();
  return ['نام', 'نام خانوادگی', 'name', 'first name', 'last name'].includes(normalized);
};

const isEmail = (val?: string | null) => val?.includes('@');

export default function CollaboratePage() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1); // 1: Terms, 2: Form, 3: Success
  const { mutate: submit, isPending } = useSubmitCollabMutation();

  const initialName = currentUser 
    ? [isPlaceholder(currentUser.firstNameFa) ? '' : currentUser.firstNameFa, isPlaceholder(currentUser.lastNameFa) ? '' : currentUser.lastNameFa].filter(Boolean).join(' ')
    : '';

  const form = useForm({
    resolver: zodResolver(getCollabSchema(t)),
    defaultValues: {
      name: initialName,
      email: currentUser?.email || '',
      mobile: currentUser?.mobile && !isEmail(currentUser.mobile) ? currentUser.mobile : '',
      fieldOfExpertise: '',
      experience: '',
      whyJoin: '',
      availability: '',
      acceptedTerms: false,
    },
  });

  const onSubmit = (values: any) => {
    submit(values, {
      onSuccess: () => {
        setStep(3);
        toast({ title: t('collaborate.successTitle') });
      },
    });
  };

  if (step === 1) {
    return (
      <div className="container max-w-3xl py-16">
        <div className="text-center mb-10">
          <Users className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold">{t('collaborate.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('collaborate.subtitle')}</p>
        </div>
        <Card>
          <CardHeader><CardTitle>{t('collaborate.terms.title')}</CardTitle></CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: t('collaborate.terms.content') }} />
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg" onClick={() => setStep(2)}>
              {t('collaborate.actions.acceptAndContinue')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="container max-w-2xl py-20 text-center">
        <Heart className="h-20 w-20 text-red-500 mx-auto mb-6 animate-pulse" />
        <h1 className="text-3xl font-bold mb-4">{t('collaborate.successTitle')}</h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-8">
          {t('collaborate.successDescription')}
        </p>
        <Button asChild size="lg">
          <a href="/">{t('actions.backToDashboard')}</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-16">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            {t('collaborate.form.title')}
          </CardTitle>
          <CardDescription>{t('collaborate.form.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>{t('contact.form.nameLabel')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>{t('contact.form.emailLabel')}</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="mobile" render={({ field }) => (
                  <FormItem><FormLabel>{t('auth.mobileLabel')}</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="fieldOfExpertise" render={({ field }) => (
                  <FormItem><FormLabel>{t('collaborate.form.expertise')}</FormLabel><FormControl><Input placeholder={t('collaborate.form.expertisePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="experience" render={({ field }) => (
                <FormItem><FormLabel>{t('collaborate.form.experience')}</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="whyJoin" render={({ field }) => (
                <FormItem><FormLabel>{t('collaborate.form.whyJoin')}</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="availability" render={({ field }) => (
                <FormItem><FormLabel>{t('collaborate.form.availability')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="acceptedTerms" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <div className="space-y-1 leading-none"><FormLabel>{t('collaborate.form.acceptTerms')}</FormLabel><FormMessage /></div>
                </FormItem>
              )} />

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>{t('actions.back')}</Button>
                <Button type="submit" className="flex-1" disabled={isPending}>
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