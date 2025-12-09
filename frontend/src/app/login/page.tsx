
'use client';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/auth-provider';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Validation schemas
const getMobileFormSchema = (t: (key: string) => string) => z.object({
  mobile: z.string().regex(/^09\d{9}$/, t('auth.errors.invalidMobile')),
});

const getOtpFormSchema = (t: (key: string) => string) => z.object({
  otp: z.string().min(6, t('auth.errors.otpRequired')).max(6, t('auth.errors.otpRequired')),
});

type MobileFormValues = z.infer<ReturnType<typeof getMobileFormSchema>>;
type OtpFormValues = z.infer<ReturnType<typeof getOtpFormSchema>>;

function MobileStep({ onMobileSubmitSuccess }: { onMobileSubmitSuccess: (mobile: string) => void }) {
  const { t } = useLanguage();
  const { requestOtp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<MobileFormValues>({
    resolver: zodResolver(getMobileFormSchema(t)),
    defaultValues: { mobile: '' },
  });

  async function onSubmit(values: MobileFormValues) {
    setIsLoading(true);
    try {
      await requestOtp(values.mobile);
      toast({ title: t('auth.otpSentTitle'), description: t('auth.otpSentDescription') });
      onMobileSubmitSuccess(values.mobile);
    } catch (error) {
      toast({ variant: 'destructive', title: t('errors.genericTitle'), description: String(error) });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <CardHeader>
        <CardTitle>{t('auth.loginTitle')}</CardTitle>
        <CardDescription>{t('auth.loginSubtitle')}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.mobileLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder="09123456789" {...field} dir="ltr" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.sendOtpButton')}
            </Button>
          </CardContent>
        </form>
      </Form>
    </>
  );
}

function OtpStep({ mobileNumber, onBack }: { mobileNumber: string; onBack: () => void }) {
  const { t } = useLanguage();
  const { verifyOtp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<OtpFormValues>({
    resolver: zodResolver(getOtpFormSchema(t)),
    defaultValues: { otp: '' },
  });

  async function onSubmit(values: OtpFormValues) {
    setIsLoading(true);
    try {
      await verifyOtp(mobileNumber, values.otp);
      toast({ title: t('auth.loginSuccessTitle') });
      
      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl) {
        router.push(decodeURIComponent(redirectUrl));
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      form.setError('otp', { type: 'manual', message: String(error) });
      toast({ variant: 'destructive', title: t('errors.genericTitle'), description: String(error) });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <CardHeader>
        <CardTitle>{t('auth.otpTitle')}</CardTitle>
        <CardDescription>
          {t('auth.otpSubtitle')} {mobileNumber}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.otpLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder="123456" {...field} dir="ltr" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={onBack} className="w-full">
                {t('actions.back')}
              </Button>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('auth.verifyButton')}
              </Button>
            </div>
          </CardContent>
        </form>
      </Form>
    </>
  );
}


export default function LoginPage() {
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');

  const handleMobileSubmit = (mobile: string) => {
    setMobileNumber(mobile);
    setStep('otp');
  };

  const handleBack = () => {
    setMobileNumber('');
    setStep('mobile');
  };

  return (
    <div className="container flex min-h-[calc(100vh-15rem)] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        {step === 'mobile' ? (
          <MobileStep onMobileSubmitSuccess={handleMobileSubmit} />
        ) : (
          <OtpStep mobileNumber={mobileNumber} onBack={handleBack} />
        )}
      </Card>
    </div>
  );
}
