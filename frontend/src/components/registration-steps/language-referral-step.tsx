
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useImperativeHandle, forwardRef } from 'react';

import { useLanguage } from '@/lib/i18n/language-provider';
import { useRegistrationWizardStore } from '@/hooks/use-registration-wizard-store';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { StepComponentProps } from '../registration-wizard';

const getLanguageReferralSchema = (t: (key: string) => string) => z.object({
  languageLevel: z.string({ required_error: t('registration.validation.required') }).min(1, t('registration.validation.required')),
  referralSource: z.string({ required_error: t('registration.validation.required') }).min(1, t('registration.validation.required')),
  referrerName: z.string().optional(),
  otherReferralSource: z.string().optional(),
}).refine(data => {
    if (data.referralSource === 'other') {
        return !!data.otherReferralSource && data.otherReferralSource.length > 0;
    }
    return true;
}, {
    message: t('registration.validation.required'),
    path: ['otherReferralSource'],
});

export const LanguageReferralStep = forwardRef<any, StepComponentProps>(({}, ref) => {
  const { t } = useLanguage();
  const { formData, setFormData, setStepValidity, currentStep } = useRegistrationWizardStore();

  type LanguageReferralFormValues = z.infer<ReturnType<typeof getLanguageReferralSchema>>;

  const form = useForm<LanguageReferralFormValues>({
    resolver: zodResolver(getLanguageReferralSchema(t)),
    defaultValues: {
      languageLevel: formData.languageLevel || '',
      referralSource: formData.referralSource || '',
      referrerName: formData.referrerName || '',
      otherReferralSource: formData.otherReferralSource || '',
    },
    mode: 'onTouched',
  });

  const referralSource = form.watch('referralSource');

  useImperativeHandle(ref, () => ({
    validate: async () => {
      const isValid = await form.trigger();
      setStepValidity(currentStep, isValid);
       if (!isValid) {
        const firstError = Object.keys(form.formState.errors)[0];
        if (firstError) {
          const element = document.getElementsByName(firstError)[0];
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element?.focus();
        }
      }
      return isValid;
    },
  }));

  useEffect(() => {
    const subscription = form.watch((values) => {
      setFormData(values as Partial<typeof formData>);
      form.trigger().then(isValid => {
        setStepValidity(currentStep, isValid);
      });
    });
    return () => subscription.unsubscribe();
  }, [form, setFormData, setStepValidity, currentStep]);

  const languageLevels = ['beginner', 'intermediate', 'advanced', 'native'];
  const referralSources = ['instagram', 'telegram', 'website', 'friends', 'other'];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">{t('registration.steps.language')}</h2>
      <p className="text-muted-foreground mb-6">{t('registration.steps.languageSubtitle')}</p>

      <Form {...form}>
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="languageLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('registration.fields.languageLevel')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('registration.placeholders.languageLevel')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {languageLevels.map(level => (
                        <SelectItem key={level} value={level}>
                          {t(`registration.fields.languageLevelsList.${level}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
          </div>
        </form>
      </Form>
    </div>
  );
});

LanguageReferralStep.displayName = "LanguageReferralStep";
