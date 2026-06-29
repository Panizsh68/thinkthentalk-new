'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useMemo } from 'react';
import { Loader2, ShieldCheck, Mail, Phone, CheckCircle2 } from 'lucide-react';

import { useLanguage } from '@/lib/i18n/language-provider';
import { useAuth } from '@/lib/auth/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const placeholderNames = ['نام', 'نام خانوادگی', 'name', 'first name', 'last name'];
const isEmail = (val?: string | null) => val?.includes('@');

const clearPlaceholderValue = (value?: string | null): string => {
  if (!value) return '';
  const normalized = value.trim().toLowerCase();
  return placeholderNames.includes(normalized) ? '' : value;
};

const getProfileSchema = (t: (key: string) => string) => z.object({
  firstNameFa: z.string().min(1, t('registration.validation.required')),
  lastNameFa: z.string().min(1, t('registration.validation.required')),
  firstNameEn: z.string().optional(),
  lastNameEn: z.string().optional(),
  age: z.coerce.number().int().positive().optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  mobile: z.string(),
  email: z.string().email().optional().or(z.literal('')),
  educationLevel: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  isEmployed: z.boolean().default(false),
  jobTitle: z.string().optional(),
  languageLevel: z.string().optional(),
}).refine(data => !data.isEmployed || (!!data.jobTitle && data.jobTitle.length > 0), {
  message: t('registration.validation.required'),
  path: ['jobTitle'],
});

type ProfileFormValues = z.infer<ReturnType<typeof getProfileSchema>>;

export default function UserProfilePage() {
  const { t, language } = useLanguage();
  const isRTL = language === 'fa';
  const { currentUser, updateUserProfile, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(getProfileSchema(t)),
    defaultValues: {
      firstNameFa: '',
      lastNameFa: '',
      firstNameEn: '',
      lastNameEn: '',
      age: '' as any,
      gender: undefined,
      mobile: '',
      email: '',
      educationLevel: '',
      fieldOfStudy: '',
      isEmployed: false,
      jobTitle: '',
      languageLevel: '',
    },
  });

  useEffect(() => {
    if (currentUser) {
      form.reset({
        firstNameFa: clearPlaceholderValue(currentUser.firstNameFa),
        lastNameFa: clearPlaceholderValue(currentUser.lastNameFa),
        firstNameEn: clearPlaceholderValue(currentUser.firstNameEn),
        lastNameEn: clearPlaceholderValue(currentUser.lastNameEn),
        age: (currentUser.age || '') as any,
        gender: currentUser.gender || undefined,
        mobile: isEmail(currentUser.mobile) ? '' : currentUser.mobile,
        email: currentUser.email || '',
        educationLevel: currentUser.educationLevel || '',
        fieldOfStudy: currentUser.fieldOfStudy || '',
        isEmployed: currentUser.isEmployed || false,
        jobTitle: currentUser.jobTitle || '',
        languageLevel: currentUser.languageLevel || '',
      });
    }
  }, [currentUser, form]);

  const identityStatus = useMemo(() => {
    return {
      emailLinked: !!currentUser?.email,
      phoneLinked: !!currentUser?.mobile && !isEmail(currentUser.mobile),
    };
  }, [currentUser]);

  async function onSubmit(values: ProfileFormValues) {
    if (!currentUser) return;
    try {
      const { mobile, ...updateData } = values;
      await updateUserProfile(updateData as any);
      toast({ title: t('profile.updateSuccessTitle'), description: t('profile.updateSuccessDescription') });
    } catch (error: any) {
      toast({ variant: 'destructive', title: t('errors.genericTitle'), description: error.message });
    }
  }

  if (isAuthLoading || !currentUser) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  const isEmployed = form.watch('isEmployed');

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className={cn(isRTL && "text-right")}>
        <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('profile.subtitle')}</p>
      </div>

      <Card className="border-primary/20 bg-primary/5 shadow-sm">
        <CardHeader className={cn(isRTL && "text-right")}>
          <CardTitle className={cn("flex items-center gap-2 text-primary", isRTL && "flex-row-reverse")}>
            <ShieldCheck className="h-5 w-5" />
            {t('profile.identity.title')}
          </CardTitle>
          <CardDescription>{t('profile.identity.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IdentityStatusItem icon={Mail} label={t('registration.fields.email')} isLinked={identityStatus.emailLinked} t={t} isRTL={isRTL} />
          <IdentityStatusItem icon={Phone} label={t('auth.mobileLabel')} isLinked={identityStatus.phoneLinked} t={t} isRTL={isRTL} />
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader className={cn(isRTL && "text-right")}><CardTitle>{t('registration.steps.personal')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="firstNameFa" render={({ field }) => (<FormItem><FormLabel>{t('registration.fields.firstNameFa')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="lastNameFa" render={({ field }) => (<FormItem><FormLabel>{t('registration.fields.lastNameFa')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="firstNameEn" render={({ field }) => (<FormItem><FormLabel>{t('registration.fields.firstNameEn')}</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="lastNameEn" render={({ field }) => (<FormItem><FormLabel>{t('registration.fields.lastNameEn')}</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="age" render={({ field }) => (<FormItem><FormLabel>{t('registration.fields.age')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem><FormLabel>{t('registration.fields.gender')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="..." /></SelectTrigger></FormControl>
                        <SelectContent dir={isRTL ? 'rtl' : 'ltr'}>
                          <SelectItem value="MALE">{t('registration.fields.genderMale')}</SelectItem>
                          <SelectItem value="FEMALE">{t('registration.fields.genderFemale')}</SelectItem>
                          <SelectItem value="OTHER">{t('registration.fields.genderOther')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={cn(isRTL && "text-right")}><CardTitle>{t('registration.steps.contact')}</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <FormField control={form.control} name="mobile" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.mobileLabel')}</FormLabel>
                    <FormControl><Input {...field} readOnly disabled dir="ltr" className="bg-muted/50" /></FormControl>
                    <FormDescription>{t('profile.mobileReadOnly')}</FormDescription>
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('registration.fields.email')}</FormLabel>
                    <FormControl><Input dir="ltr" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className={cn(isRTL && "text-right")}><CardTitle>{t('registration.steps.education')}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <FormField control={form.control} name="educationLevel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('registration.fields.educationLevel')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent dir={isRTL ? 'rtl' : 'ltr'}>
                        {['high-school', 'associate', 'bachelor', 'master', 'phd', 'other'].map(l => <SelectItem key={l} value={l}>{t(`registration.fields.educationLevels.${l}`)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="fieldOfStudy" render={({ field }) => (<FormItem><FormLabel>{t('registration.fields.fieldOfStudy')}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
              </div>
              <div className="space-y-4">
                <FormField control={form.control} name="isEmployed" render={({ field }) => (
                  <FormItem className={cn("flex flex-row items-center justify-between rounded-lg border p-4", isRTL && "flex-row-reverse")}>
                    <FormLabel className="text-base cursor-pointer">{t('registration.fields.isEmployed')}</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
                {isEmployed && (
                  <FormField control={form.control} name="jobTitle" render={({ field }) => (
                    <FormItem className="animate-in slide-in-from-top-2"><FormLabel>{t('registration.fields.jobTitle')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                )}
              </div>
            </CardContent>
          </Card>

          <div className={cn("flex justify-start", isRTL && "justify-end")}>
            <Button type="submit" size="lg" className="px-12" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('profile.saveButton')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function IdentityStatusItem({ icon: Icon, label, isLinked, t, isRTL }: { icon: any, label: string, isLinked: boolean, t: any, isRTL: boolean }) {
  return (
    <div className={cn("flex items-center justify-between p-4 bg-background rounded-lg border", isRTL && "flex-row-reverse")}>
      <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
        <div className="p-2 bg-muted rounded-full">
          <Icon className="h-5 w-5" />
        </div>
        <div className={cn(isRTL && "text-right")}>
          <p className="text-sm font-semibold">{label}</p>
          <p className={cn("text-xs flex items-center gap-1", isLinked ? "text-green-600" : "text-muted-foreground")}>
            {isLinked && <CheckCircle2 className="h-3 w-3" />}
            {isLinked ? t('profile.identity.linked') : t('profile.identity.notLinked')}
          </p>
        </div>
      </div>
      {!isLinked && (
        <Badge variant="outline" className="text-[10px] uppercase tracking-tighter">Required</Badge>
      )}
    </div>
  );
}
