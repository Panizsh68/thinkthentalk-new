'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useImperativeHandle, forwardRef } from 'react';
import Link from 'next/link';

import { useLanguage } from '@/lib/i18n/language-provider';
import { useRegistrationWizardStore } from '@/hooks/use-registration-wizard-store';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import type { StepComponentProps } from '../registration-wizard';

const getRulesSchema = (t: (key: string) => string) => z.object({
  acceptedRules: z.literal(true, {
    errorMap: () => ({ message: t('registration.validation.rulesRequired') }),
  }),
});


export const RulesStep = forwardRef<any, StepComponentProps>(({ }, ref) => {
  const { t } = useLanguage();
  const { formData, setFormData, setStepValidity, currentStep } = useRegistrationWizardStore();

  type RulesFormValues = z.infer<ReturnType<typeof getRulesSchema>>;

  const form = useForm<RulesFormValues>({
    resolver: zodResolver(getRulesSchema(t)),
    defaultValues: {
      acceptedRules: (formData.acceptedRules === true) as true,
    },
    mode: 'onTouched',
  });

  useImperativeHandle(ref, () => ({
    validate: async () => {
      const isValid = await form.trigger();
      setStepValidity(currentStep, isValid);
      if (!isValid) {
        const firstError = Object.keys(form.formState.errors)[0];
        if (firstError) {
          const element = document.getElementsByName(firstError)[0];
          element?.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element?.focus();
        }
      }
      return isValid;
    },
  }));

  useEffect(() => {
    const subscription = form.watch((values) => {
      setFormData({ acceptedRules: values.acceptedRules || false });
      form.trigger().then(isValid => {
        setStepValidity(currentStep, isValid);
      });
    });
    return () => subscription.unsubscribe();
  }, [form, setFormData, setStepValidity, currentStep]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">{t('registration.steps.rules')}</h2>
      <p className="text-muted-foreground mb-6">{t('registration.steps.rulesSubtitle')}</p>

      <Form {...form}>
        <form className="space-y-4">
          <FormField
            control={form.control}
            name="acceptedRules"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    <span dangerouslySetInnerHTML={{
                      __html: t('registration.fields.acceptRules')
                        .replace('{terms}', `<a href="/terms" target="_blank" class="text-primary underline hover:text-primary/80">${t('registration.fields.termsLink')}</a>`)
                        .replace('{privacy}', `<a href="/privacy" target="_blank" class="text-primary underline hover:text-primary/80">${t('registration.fields.privacyLink')}</a>`)
                    }} />
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
});

RulesStep.displayName = "RulesStep";
