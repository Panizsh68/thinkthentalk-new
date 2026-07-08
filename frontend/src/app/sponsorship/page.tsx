
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useAuth } from '@/lib/auth/auth-provider';
import { useSubmitSponsorMutation } from '@/hooks/use-partnership-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Building, Trophy, Rocket, Star, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const plans = [
  { id: 'BRONZE', icon: Rocket, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'SILVER', icon: ShieldCheck, color: 'text-slate-400', bg: 'bg-slate-50' },
  { id: 'GOLD', icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: 'PLATINUM', icon: Star, color: 'text-purple-600', bg: 'bg-purple-50' },
];

const getSponsorSchema = (t: any) => z.object({
  companyName: z.string().min(2, t('registration.validation.required')),
  representativeName: z.string().min(2, t('registration.validation.required')),
  email: z.string().email(t('contact.errors.emailInvalid')),
  mobile: z.string().regex(/^09\d{9}$/, t('auth.errors.invalidMobile')),
  plan: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']),
  description: z.string().optional(),
});

export default function SponsorshipPage() {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1); // 1: Plans, 2: Form, 3: Success
  const { mutate: submit, isPending } = useSubmitSponsorMutation();

  const form = useForm({
    resolver: zodResolver(getSponsorSchema(t)),
    defaultValues: {
      companyName: '',
      representativeName: currentUser ? `${currentUser.firstNameFa} ${currentUser.lastNameFa}` : '',
      email: currentUser?.email || '',
      mobile: currentUser?.mobile || '',
      plan: 'BRONZE' as any,
      description: '',
    },
  });

  const onSubmit = (values: any) => {
    submit(values, {
      onSuccess: () => {
        setStep(3);
        toast({ title: t('sponsorship.successTitle') });
      },
    });
  };

  if (!currentUser) {
    return (
      <div className="container max-w-2xl py-20 px-4">
        <Card className="rounded-[2rem] border-none shadow-xl">
          <CardHeader className="text-center">
            <CardTitle>{t('sponsorship.panel.loginTitle')}</CardTitle>
            <CardDescription>{t('sponsorship.panel.loginDescription')}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="h-12 w-full rounded-xl font-bold">
              <Link href="/login">{t('auth.loginButton')}</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const selectedPlan = form.watch('plan');

  if (step === 3) {
    return (
      <div className="container max-w-2xl py-20 text-center">
        <Trophy className="h-20 w-20 text-yellow-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">{t('sponsorship.successTitle')}</h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-8">
          {t('sponsorship.successDescription')}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="rounded-full font-bold">
            <Link href="/my-requests">{t('partnership.panel.navLabel')}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full font-bold">
            <Link href="/dashboard">{t('actions.backToDashboard')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-16">
      <div className="text-center mb-12 space-y-4">
        <Building className="h-16 w-16 text-primary mx-auto" />
        <h1 className="text-4xl font-bold tracking-tight">{t('sponsorship.title')}</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {t('sponsorship.subtitle')}
        </p>
      </div>

      {step === 1 ? (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p) => (
              <Card key={p.id} className={cn("relative overflow-hidden border-2 transition-all hover:shadow-xl", selectedPlan === p.id && "border-primary shadow-lg ring-2 ring-primary/20")}>
                <div className={cn("absolute top-0 right-0 p-2 opacity-10", p.color)}>
                  <p.icon className="h-20 w-20" />
                </div>
                <CardHeader>
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4", p.bg)}>
                    <p.icon className={cn("h-6 w-6", p.color)} />
                  </div>
                  <CardTitle>{t(`sponsorship.plans.${p.id}.name`)}</CardTitle>
                  <CardDescription>{t(`sponsorship.plans.${p.id}.subtitle`)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-2xl font-bold">
                    {t(`sponsorship.plans.${p.id}.price`)}
                  </div>
                  <ul className="space-y-2 text-sm">
                    {/* Simplified: assume 3 perks per plan */}
                    <li className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-green-500" /> {t(`sponsorship.plans.${p.id}.perk1`)}</li>
                    <li className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-green-500" /> {t(`sponsorship.plans.${p.id}.perk2`)}</li>
                    <li className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-green-500" /> {t(`sponsorship.plans.${p.id}.perk3`)}</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={selectedPlan === p.id ? 'default' : 'outline'} 
                    className="w-full"
                    onClick={() => {
                      form.setValue('plan', p.id as any);
                      setStep(2);
                    }}
                  >
                    {t('sponsorship.actions.choosePlan')}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>{t('sponsorship.form.title')}</CardTitle>
            <CardDescription>{t('sponsorship.form.subtitle', { plan: t(`sponsorship.plans.${selectedPlan}.name`) })}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="companyName" render={({ field }) => (
                    <FormItem><FormLabel>{t('sponsorship.form.companyLabel')}</FormLabel><FormControl><Input placeholder="e.g. Acme Corp" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="representativeName" render={({ field }) => (
                    <FormItem><FormLabel>{t('sponsorship.form.nameLabel')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>{t('contact.form.emailLabel')}</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={form.control} name="mobile" render={({ field }) => (
                    <FormItem><FormLabel>{t('auth.mobileLabel')}</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>{t('sponsorship.form.notes')}</FormLabel><FormControl><Textarea rows={4} placeholder={t('sponsorship.form.notesPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>{t('actions.back')}</Button>
                  <Button type="submit" className="flex-1" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('sponsorship.form.submit')}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CheckIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
  );
}
