
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useImperativeHandle, forwardRef } from 'react';

import { useLanguage } from '@/lib/i18n/language-provider';
import { useRegistrationWizardStore } from '@/hooks/use-registration-wizard-store';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { StepComponentProps } from '../registration-wizard';

// Schema for this step
const getPersonalInfoSchema = (t: (key: string) => string) => z.object({
  firstNameFa: z.string().min(1, t('registration.validation.required')),
  lastNameFa: z.string().min(1, t('registration.validation.required')),
  firstNameEn: z.string().optional(),
  lastNameEn: z.string().optional(),
  age: z.coerce.number({invalid_type_error: t('registration.validation.positiveNumber')}).int().positive(t('registration.validation.positiveNumber')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    required_error: t('registration.validation.required'),
  }),
});


export const PersonalInfoStep = forwardRef<any, StepComponentProps>(({}, ref) => {
  const { t } = useLanguage();
  const { formData, setFormData, setStepValidity, currentStep } = useRegistrationWizardStore();

  type PersonalInfoFormValues = z.infer<ReturnType<typeof getPersonalInfoSchema>>;

  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(getPersonalInfoSchema(t)),
    defaultValues: {
      firstNameFa: formData.firstNameFa || '',
      lastNameFa: formData.lastNameFa || '',
      firstNameEn: formData.firstNameEn || '',
      lastNameEn: formData.lastNameEn || '',
      age: formData.age || undefined,
      gender: formData.gender || undefined,
    },
    mode: 'onTouched',
  });

  useImperativeHandle(ref, () => ({
    validate: async () => {
      const isValid = await form.trigger();
      setStepValidity(currentStep, isValid);
      if (!isValid) {
        const firstErrorField = Object.keys(form.formState.errors)[0];
        if (firstErrorField) {
            const element = document.getElementsByName(firstErrorField)[0];
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

  return (
    <div>
       <h2 className="text-xl font-semibold mb-1">{t('registration.steps.personal')}</h2>
       <p className="text-muted-foreground mb-6">{t('registration.steps.personalSubtitle')}</p>
      
      <Form {...form}>
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstNameFa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('registration.fields.firstNameFa')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('registration.placeholders.firstNameFa')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastNameFa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('registration.fields.lastNameFa')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('registration.placeholders.lastNameFa')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="firstNameEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('registration.fields.firstNameEn')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('registration.placeholders.firstNameEn')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="lastNameEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('registration.fields.lastNameEn')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('registration.placeholders.lastNameEn')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('registration.fields.age')}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder={t('registration.placeholders.age')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="space-y-3">
                    <FormLabel>{t('registration.fields.gender')}</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex items-center gap-4"
                        >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="MALE" />
                            </FormControl>
                            <FormLabel className="font-normal">{t('registration.fields.genderMale')}</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="FEMALE" />
                            </FormControl>
                            <FormLabel className="font-normal">{t('registration.fields.genderFemale')}</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="OTHER" />
                            </FormControl>
                            <FormLabel className="font-normal">{t('registration.fields.genderOther')}</FormLabel>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </div>
  );
});

PersonalInfoStep.displayName = "PersonalInfoStep";
