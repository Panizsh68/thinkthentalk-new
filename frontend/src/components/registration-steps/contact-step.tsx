
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useRegistrationWizardStore } from '@/hooks/use-registration-wizard-store';
import { useAuth } from '@/lib/auth/auth-provider';
import type { StepRef, StepComponentProps } from '../registration-wizard';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';

const getContactSchema = (t: (key: string) => string) =>
  z.object({
    mobile: z.string().regex(/^09\d{9}$/, t('auth.errors.invalidMobile')),
    email: z.string().email({ message: t('registration.validation.invalidEmail') }),
  });

export const ContactStep = forwardRef<StepRef, StepComponentProps>(({}, ref) => {
  const { t } = useLanguage();
  const { formData, setFormData, setStepValidity, currentStep } = useRegistrationWizardStore();
  const { currentUser, requestOtp, updateUserProfile } = useAuth();
  const { toast } = useToast();

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  // Check if current mobile is a valid Iranian number
  const isRealMobile = (val?: string) => val ? /^09\d{9}$/.test(val) : false;
  const initialMobile = formData.mobile || (isRealMobile(currentUser?.mobile) ? currentUser?.mobile : '');
  const [isVerified, setIsVerified] = useState(isRealMobile(initialMobile));

  type ContactFormValues = z.infer<ReturnType<typeof getContactSchema>>;

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(getContactSchema(t)),
    defaultValues: {
      mobile: initialMobile,
      email: formData.email || currentUser?.email || '',
    },
    mode: 'onTouched',
  });
  
  useImperativeHandle(ref, () => ({
    validate: async () => {
      if (!isVerified) {
        toast({
          variant: 'destructive',
          title: t('errors.genericTitle'),
          description: t('registration.errors.phoneRequired'),
        });
        return false;
      }
      const isValid = await form.trigger();
      setStepValidity(currentStep, isValid);
      return isValid;
    },
  }));

  useEffect(() => {
    const subscription = form.watch((values: Partial<ContactFormValues>) => {
      setFormData({ 
        mobile: values?.mobile ?? '', 
        email: values?.email ?? '' 
      } as Partial<typeof formData>);
      
      const mobileValid = isRealMobile(values?.mobile);
      // If user types a new valid number that is different from their current one, we require re-verification
      if (mobileValid && values?.mobile !== currentUser?.mobile) {
         // Optionally reset verified status if they change a already verified number
         // setIsVerified(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, setFormData, currentUser?.mobile]);

  const handleSendCode = async () => {
    const mobile = form.getValues('mobile');
    if (!isRealMobile(mobile)) {
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
      // We use the same verify-otp endpoint but we don't want to switch tokens
      // We just need to know if it's valid.
      const response = await apiClient.post<any>('/auth/verify-otp', { mobile, otp: otpValue });
      
      if (response.data) {
        // Update user profile on backend to save the verified number
        await updateUserProfile({ mobile });
        setIsVerified(true);
        setVerificationSent(false);
        setStepValidity(currentStep, true);
        toast({ title: t('registration.fields.verifySuccess') });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: t('errors.genericTitle'), description: t('registration.errors.verifyFailed') });
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">{t('registration.steps.contact')}</h2>
        <p className="text-muted-foreground mb-6">{t('registration.steps.contactSubtitle')}</p>
      </div>

      <Form {...form}>
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{t('auth.mobileLabel')}</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <div className="relative flex-1">
                        <Input 
                          {...field} 
                          dir="ltr" 
                          placeholder="09123456789"
                          disabled={isVerified || verificationSent}
                          className={cn(isVerified && "pr-10 border-green-500")}
                        />
                        {isVerified && (
                          <CheckCircle2 className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </FormControl>
                    {!isVerified && !verificationSent && (
                      <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={handleSendCode} 
                        disabled={isVerifying || !isRealMobile(field.value)}
                      >
                        {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : t('registration.fields.sendCode')}
                      </Button>
                    )}
                    {(isVerified || verificationSent) && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setIsVerified(false);
                          setVerificationSent(false);
                          setOtpValue('');
                        }}
                      >
                        {t('actions.edit')}
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
                  <FormDescription>
                    {isVerified ? t('registration.descriptions.mobileReadOnly') : t('auth.loginSubtitle')}
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
      
      {!isVerified && !verificationSent && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-400">
            {t('registration.errors.phoneRequired')}
          </div>
        </div>
      )}
    </div>
  );
});
ContactStep.displayName = "ContactStep";
