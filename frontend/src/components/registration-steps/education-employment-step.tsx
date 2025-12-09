
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
import { Switch } from '@/components/ui/switch';
import type { StepComponentProps } from '../registration-wizard';


const getEducationEmploymentSchema = (t: (key: string) => string) => z.object({
  educationLevel: z.string({ required_error: t('registration.validation.required') }).min(1, t('registration.validation.required')),
  fieldOfStudy: z.string().optional(),
  isEmployed: z.boolean().default(false),
  jobTitle: z.string().optional(),
}).refine(data => {
    // If employed, job title is required
    if (data.isEmployed) {
        return !!data.jobTitle && data.jobTitle.length > 0;
    }
    return true;
}, {
    message: t('registration.validation.required'),
    path: ['jobTitle'], // specify the path of the error
});

export const EducationEmploymentStep = forwardRef<any, StepComponentProps>(({}, ref) => {
  const { t } = useLanguage();
  const { formData, setFormData, setStepValidity, currentStep } = useRegistrationWizardStore();

  type EducationEmploymentFormValues = z.infer<ReturnType<typeof getEducationEmploymentSchema>>;

  const form = useForm<EducationEmploymentFormValues>({
    resolver: zodResolver(getEducationEmploymentSchema(t)),
    defaultValues: {
      educationLevel: formData.educationLevel || '',
      fieldOfStudy: formData.fieldOfStudy || '',
      isEmployed: formData.isEmployed || false,
      jobTitle: formData.jobTitle || '',
    },
    mode: 'onTouched',
  });
  
  const isEmployed = form.watch('isEmployed');

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

  // Update zustand store on every valid form change
  useEffect(() => {
    const subscription = form.watch((values) => {
      setFormData(values as Partial<typeof formData>);
      form.trigger().then(isValid => {
        setStepValidity(currentStep, isValid);
      });
    });
    return () => subscription.unsubscribe();
  }, [form, setFormData, setStepValidity, currentStep]);

  const educationLevels = [
    'high-school', 'associate', 'bachelor', 'master', 'phd', 'other'
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">{t('registration.steps.education')}</h2>
      <p className="text-muted-foreground mb-6">{t('registration.steps.educationSubtitle')}</p>
      
      <Form {...form}>
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormField
              control={form.control}
              name="educationLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('registration.fields.educationLevel')}</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('registration.placeholders.educationLevel')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {educationLevels.map(level => (
                            <SelectItem key={level} value={level}>
                                {t(`registration.fields.educationLevels.${level}`)}
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
              name="fieldOfStudy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('registration.fields.fieldOfStudy')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('registration.placeholders.fieldOfStudy')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="md:col-span-2 space-y-4">
                 <FormField
                  control={form.control}
                  name="isEmployed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          {t('registration.fields.isEmployed')}
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {isEmployed && (
                     <FormField
                      control={form.control}
                      name="jobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('registration.fields.jobTitle')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('registration.placeholders.jobTitle')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                )}
             </div>
          </div>
        </form>
      </Form>
    </div>
  );
});

EducationEmploymentStep.displayName = "EducationEmploymentStep";
