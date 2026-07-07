'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useMemo, useState } from 'react';
import { Loader2, ShieldCheck, Mail, Phone, CheckCircle2, AlertTriangle, Send } from 'lucide-react';

import { useLanguage } from '@/lib/i18n/language-provider';
import { useAuth } from '@/lib/auth/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';

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
  const { currentUser, updateUserProfile, isLoading: isAuthLoading, requestOtp } = useAuth();
  const { toast } = useToast();

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

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
    const email = currentUser?.email;
    const mobile = currentUser?.mobile;
    const isRealMobile = (val?: string) => val ? /^09\d{9}$/.test(val) : false;
    return {
      emailLinked: !!email && email.includes('@'),
      phoneLinked: isRealMobile(mobile),
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

  const handleSendCode = async () => {
    const mobile = form.getValues('mobile');
    if (!/^09\d{9}$/.test(mobile)) {
      form.setError('mobile', { message: t('auth.errors.invalidMobile') });
      return;
    }

    setIsVerifying(true);
    try {
      await requestOtp(mobile);
      setVerificationSent(true);
      toast({ title: t('auth.otpSentTitle') });
    } catch (error: any) {
      toast({ variant: 'destructive', title: t('errors.genericTitle'), description: error.message });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmCode = async () => {
    if (otpValue.length < 6) return;
    setIsConfirming(true);
    try {
      const mobile = form.getValues('mobile');
      const response = await apiClient.post<any>('/auth/verify-otp', { mobile, otp: otpValue });
      
      if (response.data) {
        await updateUserProfile({ mobile });
        setVerificationSent(false);
        setOtpValue('');
        toast({ title: t('registration.fields.verifySuccess') });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: t('errors.genericTitle'), description: t('registration.errors.verifyFailed') });
    } finally {
      setIsConfirming(false);
    }
  };

  if (isAuthLoading || !currentUser) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  const isEmployed = form.watch('isEmployed');

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className={cn(isRTL && "text-right")}>
        <h1 className="text-3xl font-black tracking-tight">{t('profile.title')}</h1>
        <p className="text-muted-foreground mt-2 font-medium">{t('profile.subtitle')}</p>
      </div>

      <Card className="border-primary/20 bg-primary/5 shadow-sm rounded-[2rem] overflow-hidden">
        <CardHeader className={cn(isRTL && "text-right")}>
          <CardTitle className={cn("flex items-center gap-2 text-primary font-black", isRTL && "flex-row-reverse")}>
            <ShieldCheck className="h-5 w-5" />
            {t('profile.identity.title')}
          </CardTitle>
          <CardDescription className="font-medium">{t('profile.identity.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IdentityStatusItem icon={Mail} label={t('registration.fields.email')} isLinked={identityStatus.emailLinked} t={t} isRTL={isRTL} />
          <IdentityStatusItem icon={Phone} label={t('auth.mobileLabel')} isLinked={identityStatus.phoneLinked} t={t} isRTL={isRTL} />
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="rounded-[2rem]">
              <CardHeader className={cn(isRTL && "text-right")}><CardTitle className="font-bold">{t('registration.steps.personal')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="firstNameFa" render={({ field }) => (<FormItem><FormLabel>{t('registration.fields.firstNameFa')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="lastNameFa" render={({ field }) => ( <FormItem><FormLabel>{t('registration.fields.lastNameFa')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="firstNameEn" render={({ field }) => (<FormItem><FormLabel>{t('registration.fields.firstNameEn')}</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="lastNameEn" render={({ field }) => ( <FormItem><FormLabel>{t('registration.fields.lastNameEn')}</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="age" render={({ field }) => (<FormItem><FormLabel>{t('registration.fields.age')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem><FormLabel>{t('registration.fields.gender')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="..." /></SelectTrigger></FormControl>
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

            <Card className="rounded-[2rem]">
              <CardHeader className={cn(isRTL && "text-right")}><CardTitle className="font-bold">{t('registration.steps.contact')}</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <FormField control={form.control} name="mobile" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.mobileLabel')}</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <div className="relative flex-1">
                          <Input 
                            {...field} 
                            dir="ltr" 
                            placeholder="09123456789" 
                            disabled={identityStatus.phoneLinked || verificationSent} 
                            className={cn("rounded-xl", identityStatus.phoneLinked && "pr-10 border-green-500 bg-muted/50")} 
                          />
                          {identityStatus.phoneLinked && (
                            <CheckCircle2 className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
                          )}
                        </div>
                      </FormControl>
                      {!identityStatus.phoneLinked && !verificationSent && (
                        <Button 
                          type="button" 
                          variant="secondary" 
                          onClick={handleSendCode} 
                          disabled={isVerifying || !/^09\d{9}$/.test(field.value)}
                        >
                          {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : t('registration.fields.sendCode')}
                        </Button>
                      )}
                    </div>
                    {verificationSent && (
                      <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                          <FormLabel>{t('registration.fields.verificationCode')}</FormLabel>
                          <div className="flex gap-2">
                            <Input 
                              value={otpValue} 
                              onChange={(e) => setOtpValue(e.target.value)} 
                              placeholder="123456" 
                              dir="ltr" 
                              maxLength={6}
                            />
                            <Button 
                              type="button" 
                              onClick={handleConfirmCode} 
                              disabled={isConfirming || otpValue.length < 6}
                            >
                              {isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : t('actions.confirm')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    <FormDescription className="text-xs">
                      {identityStatus.phoneLinked ? t('profile.mobileReadOnly') : t('auth.loginSubtitle')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('registration.fields.email')}</FormLabel>
                    <FormControl><Input dir="ltr" {...field} className="rounded-xl" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[2rem]">
            <CardHeader className={cn(isRTL && "text-right")}><CardTitle className="font-bold">{t('registration.steps.education')}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <FormField control={form.control} name="educationLevel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('registration.fields.educationLevel')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent dir={isRTL ? 'rtl' : 'ltr'}>
                        {['high-school', 'associate', 'bachelor', 'master', 'phd', 'other'].map(l => <SelectItem key={l} value={l}>{t(`registration.fields.educationLevels.${l}`)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="fieldOfStudy" render={({ field }) => (<FormItem><FormLabel>{t('registration.fields.fieldOfStudy')}</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>)} />
              </div>
              <div className="space-y-4">
                <FormField control={form.control} name="isEmployed" render={({ field }) => (
                  <FormItem className={cn("flex flex-row items-center justify-between rounded-xl border p-4", isRTL && "flex-row-reverse")}>
                    <FormLabel className="text-base cursor-pointer font-bold">{t('registration.fields.isEmployed')}</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
                {isEmployed && (
                  <FormField control={form.control} name="jobTitle" render={({ field }) => (
                    <FormItem className="animate-in slide-in-from-top-2"><FormLabel>{t('registration.fields.jobTitle')}</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                  )} />
                )}
              </div>
            </CardContent>
          </Card>

          <div className={cn("flex justify-start pt-4", isRTL && "justify-end")}>
            <Button type="submit" size="lg" className="px-12 h-14 rounded-2xl font-black shadow-lg" disabled={form.formState.isSubmitting}>
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
    <div className={cn("flex items-center justify-between p-4 bg-background rounded-2xl border border-border/40", isRTL && "flex-row-reverse")}>
      <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
        <div className="p-3 bg-muted rounded-xl">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className={cn(isRTL && "text-right")}>
          <p className="text-sm font-black">{label}</p>
          <p className={cn("text-xs flex items-center gap-1 font-bold", isLinked ? "text-green-600" : "text-muted-foreground")}>
            {isLinked && <CheckCircle2 className="h-3 w-3" />}
            {isLinked ? t('profile.identity.linked') : t('profile.identity.notLinked')}
          </p>
        </div>
      </div>
      {!isLinked && (
        <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-black border-amber-200 text-amber-700 bg-amber-50">Required</Badge>
      )}
    </div>
  );
}