
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useImperativeHandle, forwardRef } from 'react';

import { useLanguage } from '@/lib/i18n/language-provider';
import { useRegistrationWizardStore } from '@/hooks/use-registration-wizard-store';
import { useAuth } from '@/lib/auth/auth-provider';

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { StepComponentProps } from '../registration-wizard';

const getContactSchema = (t: (key: string) => string) => z.object({
  mobile: z.string().regex(/^09\d{9}$/, t('auth.errors.invalidMobile')),
  email: z.string().email({ message: t('registration.validation.invalidEmail') }).optional().or(z.literal('')),
});

export const ContactStep = forwardRef<any, StepComponentProps>(({}, ref) => {
  const { t } = useLanguage();
  const { formData, setFormData, setStepValidity, currentStep } = useRegistrationWizardStore();
  const { currentUser } = useAuth();

  type ContactFormValues = z.infer<ReturnType<typeof getContactSchema>>;

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(getContactSchema(t)),
    defaultValues: {
      mobile: currentUser?.mobile || '',
      email: formData.email || '',
    },
    mode: 'onTouched',
  });
  
  useImperativeHandle(ref, () => ({
    validate: async () => {
      const isValid = await form.trigger();
      setStepValidity(currentStep, isValid);
      if (!isValid) {
        // Find the first invalid field and scroll to it
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

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">{t('registration.steps.contact')}</h2>
      <p className="text-muted-foreground mb-6">{t('registration.steps.contactSubtitle')}</p>

      <Form {...form}>
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.mobileLabel')}</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly disabled dir="ltr" />
                  </FormControl>
                  <FormDescription>
                    {t('registration.descriptions.mobileReadOnly')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('registration.fields.email')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('registration.placeholders.email')} {...field} dir="ltr" />
                  </FormControl>
                   <FormDescription>
                    {t('registration.descriptions.emailOptional')}
                  </FormDescription>
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
ContactStep.displayName = "ContactStep";
