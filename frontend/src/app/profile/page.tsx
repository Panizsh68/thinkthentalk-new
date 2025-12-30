
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

import { useLanguage } from '@/lib/i18n/language-provider';
import { useAuth } from '@/lib/auth/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const placeholderNames = ['نام', 'نام خانوادگی', 'name', 'first name', 'last name'];
const clearPlaceholderName = (value?: string | null): string => {
  if (!value) return '';
  const normalized = value.trim().toLowerCase();
  return placeholderNames.includes(normalized) ? '' : value;
};

const getProfileSchema = (t: (key: string) => string) => z.object({
  // Personal
  firstNameFa: z.string().min(1, t('registration.validation.required')),
  lastNameFa: z.string().min(1, t('registration.validation.required')),
  firstNameEn: z.string().optional(),
  lastNameEn: z.string().optional(),
  age: z.coerce.number({ invalid_type_error: t('registration.validation.positiveNumber') }).int().positive(t('registration.validation.positiveNumber')).optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),

  // Contact
  mobile: z.string(),
  email: z.string().email({ message: t('registration.validation.invalidEmail') }).optional().or(z.literal('')),

  // Education & Employment
  educationLevel: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  isEmployed: z.boolean().default(false),
  jobTitle: z.string().optional(),

  // Avatar
  avatarUrl: z.string().optional(),

  // Language
  languageLevel: z.string().optional(),
}).refine(data => {
  if (data.isEmployed) {
    return !!data.jobTitle && data.jobTitle.length > 0;
  }
  return true;
}, {
  message: t('registration.validation.required'),
  path: ['jobTitle'],
});

type ProfileFormValues = z.infer<ReturnType<typeof getProfileSchema>>;

export default function UserProfilePage() {
  const { t } = useLanguage();
  const { currentUser, updateUserProfile, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  // Avatar upload temporarily disabled

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
      avatarUrl: '',
      languageLevel: '',
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (currentUser) {
      form.reset({
        firstNameFa: clearPlaceholderName(currentUser.firstNameFa),
        lastNameFa: clearPlaceholderName(currentUser.lastNameFa),
        firstNameEn: clearPlaceholderName(currentUser.firstNameEn),
        lastNameEn: clearPlaceholderName(currentUser.lastNameEn),
        age: (currentUser.age || '') as any,
        gender: currentUser.gender || undefined,
        mobile: currentUser.mobile || '',
        email: currentUser.email || '',
        educationLevel: currentUser.educationLevel || '',
        fieldOfStudy: currentUser.fieldOfStudy || '',
        isEmployed: currentUser.isEmployed || false,
        jobTitle: currentUser.jobTitle || '',
        avatarUrl: (currentUser as any).avatarUrl || '',
        languageLevel: currentUser.languageLevel || '',
      });
    }
  }, [currentUser?.id, form]);

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

  const isEmployed = form.watch('isEmployed');
  const educationLevels = ['high-school', 'associate', 'bachelor', 'master', 'phd', 'other'];
  const languageLevels = ['beginner', 'intermediate', 'advanced', 'native'];

  if (isAuthLoading || !currentUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('profile.title')}</h1>
        <p className="text-muted-foreground">{t('profile.subtitle')}</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" data-testid="profile-form">
          {/* Personal Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('registration.steps.personal')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="firstNameFa" render={({ field }) => (<FormItem><FormLabel>{t('registration.fields.firstNameFa')}</FormLabel><FormControl><Input placeholder={t('registration.placeholders.firstNameFa')} {...field} data-testid="profile-firstNameFa-input" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="lastNameFa" render={({ field }) => (<FormItem><FormLabel>{t('registration.fields.lastNameFa')}</FormLabel><FormControl><Input placeholder={t('registration.placeholders.lastNameFa')} {...field} data-testid="profile-lastNameFa-input" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="firstNameEn" render={({ field }) => (<FormItem><FormLabel>{t('registration.fields.firstNameEn')}</FormLabel><FormControl><Input placeholder={t('registration.placeholders.firstNameEn')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="lastNameEn" render={({ field }) => (<FormItem><FormLabel>{t('registration.fields.lastNameEn')}</FormLabel><FormControl><Input placeholder={t('registration.placeholders.lastNameEn')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="age" render={({ field }) => (<FormItem><FormLabel>{t('registration.fields.age')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem className="space-y-3"><FormLabel>{t('registration.fields.gender')}</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center gap-4">
                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="MALE" /></FormControl><FormLabel className="font-normal">{t('registration.fields.genderMale')}</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="FEMALE" /></FormControl><FormLabel className="font-normal">{t('registration.fields.genderFemale')}</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="OTHER" /></FormControl><FormLabel className="font-normal">{t('registration.fields.genderOther')}</FormLabel></FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              {/* Avatar upload temporarily disabled */}
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card>
            <CardHeader><CardTitle>{t('registration.steps.contact')}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="mobile" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.mobileLabel')}</FormLabel>
                    <FormControl><Input {...field} readOnly disabled dir="ltr" /></FormControl>
                    <FormDescription>{t('profile.mobileReadOnly')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('registration.fields.email')}</FormLabel>
                    <FormControl><Input dir="ltr" {...field} data-testid="profile-email-input" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          {/* Education Card */}
          <Card>
            <CardHeader><CardTitle>{t('registration.steps.education')}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="educationLevel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('registration.fields.educationLevel')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder={t('registration.placeholders.educationLevel')} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {educationLevels.map(level => <SelectItem key={level} value={level}>{t(`registration.fields.educationLevels.${level}`)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="fieldOfStudy" render={({ field }) => (<FormItem><FormLabel>{t('registration.fields.fieldOfStudy')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="md:col-span-2 space-y-4">
                  <FormField control={form.control} name="isEmployed" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <FormLabel className="text-base">{t('registration.fields.isEmployed')}</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                  {isEmployed && (
                    <FormField control={form.control} name="jobTitle" render={({ field }) => (
                      <FormItem><FormLabel>{t('registration.fields.jobTitle')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language Card */}
          <Card>
            <CardHeader><CardTitle>{t('profile.languageSectionTitle')}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="languageLevel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('registration.fields.languageLevel')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder={t('registration.placeholders.languageLevel')} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {languageLevels.map(level => <SelectItem key={level} value={level}>{t(`registration.fields.languageLevelsList.${level}`)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={form.formState.isSubmitting} data-testid="profile-save-button">
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('profile.saveButton')}
          </Button>
        </form>
      </Form>
    </div>
  );
}
