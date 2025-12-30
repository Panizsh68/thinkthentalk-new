
'use client';
import { UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLanguage } from '@/lib/i18n/language-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export const getProfileSchema = (t: (key: string) => string) => z.object({
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
  
  // Language & Referral
  languageLevel: z.string().optional(),
  referralSource: z.string().optional(),
  referrerName: z.string().optional(),
  otherReferralSource: z.string().optional(),
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

interface RegistrationEditFormProps {
    form: UseFormReturn<ProfileFormValues>;
}

export function RegistrationEditForm({ form }: RegistrationEditFormProps) {
  const { t } = useLanguage();
  const isEmployed = form.watch('isEmployed');
  const referralSource = form.watch('referralSource');
  const educationLevels = ['high-school', 'associate', 'bachelor', 'master', 'phd', 'other'];
  const languageLevels = ['beginner', 'intermediate', 'advanced', 'native'];
  const referralSources = ['instagram', 'telegram', 'website', 'friends', 'other'];

  return (
    <Form {...form}>
      <form className="space-y-8">
            <Card>
                <CardHeader><CardTitle>{t('registration.steps.personal')}</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="firstNameFa" render={({ field }) => ( <FormItem><FormLabel>{t('registration.fields.firstNameFa')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="lastNameFa" render={({ field }) => ( <FormItem><FormLabel>{t('registration.fields.lastNameFa')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="firstNameEn" render={({ field }) => ( <FormItem><FormLabel>{t('registration.fields.firstNameEn')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="lastNameEn" render={({ field }) => ( <FormItem><FormLabel>{t('registration.fields.lastNameEn')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="age" render={({ field }) => ( <FormItem><FormLabel>{t('registration.fields.age')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
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
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader><CardTitle>{t('registration.steps.contact')}</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="mobile" render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('auth.mobileLabel')}</FormLabel>
                            <FormControl><Input {...field} readOnly disabled dir="ltr" /></FormControl>
                            <FormMessage />
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
                    <FormField control={form.control} name="fieldOfStudy" render={({ field }) => ( <FormItem><FormLabel>{t('registration.fields.fieldOfStudy')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                     <div className="space-y-4">
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
                </CardContent>
            </Card>
            
             <Card>
                <CardHeader><CardTitle>{t('registration.steps.language')}</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <FormField
                        control={form.control}
                        name="referralSource"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t('registration.fields.referralSource')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('registration.placeholders.referralSource')} />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {referralSources.map(source => (
                                    <SelectItem key={source} value={source}>
                                    {t(`registration.fields.referralSources.${source}`)}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />

                        {referralSource === 'friends' && (
                        <FormField
                            control={form.control}
                            name="referrerName"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('registration.fields.referrerName')}</FormLabel>
                                <FormControl>
                                <Input placeholder={t('registration.placeholders.referrerName')} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        )}

                        {referralSource === 'other' && (
                        <FormField
                            control={form.control}
                            name="otherReferralSource"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('registration.fields.otherReferralSource')}</FormLabel>
                                <FormControl>
                                <Input placeholder={t('registration.placeholders.otherReferralSource')} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        )}
                </CardContent>
             </Card>
      </form>
    </Form>
  );
}
