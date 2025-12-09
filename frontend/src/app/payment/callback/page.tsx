
'use client';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useVerifyPaymentMutation, usePaymentQuery } from '@/hooks/use-payment-queries';
import { useEventQuery } from '@/hooks/use-event-queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-provider';
import { AddToCalendarButton } from '@/components/add-to-calendar-button';
import { getRegistrationWizardUrl, getFormattedDateTime } from '@/lib/event-helpers';
import { getLocalizedTextValue } from '@/lib/i18n/get-localized-text';

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const status = searchParams.get('status') as 'SUCCESS' | 'FAILED' | null;
  const { t, language } = useLanguage();

  const { data: payment, isLoading: isLoadingPayment, error: paymentError } = usePaymentQuery(paymentId);
  const { data: event, isLoading: isLoadingEvent } = useEventQuery(payment?.eventId || '');
  const { mutate: verifyPayment, isPending: isVerifying } = useVerifyPaymentMutation();

  useEffect(() => {
    if (paymentId && status && payment && payment.status === 'PENDING') {
        verifyPayment({ paymentId, status });
    }
  }, [paymentId, status, payment, verifyPayment]);

  const isLoading = isVerifying || isLoadingPayment || (payment?.eventId && isLoadingEvent);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center" data-testid="payment-verifying">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">{t('payment.verifying')}</p>
      </div>
    );
  }

  if (!paymentId || paymentError) {
     return (
      <div className="flex flex-col items-center justify-center gap-4 text-center text-destructive" data-testid="payment-error">
        <AlertTriangle className="h-12 w-12" />
        <h2 className="text-2xl font-semibold">{t('payment.invalidRequestTitle')}</h2>
        <p className="text-muted-foreground">{t('payment.invalidRequestDescription')}</p>
        <Button asChild><Link href="/events">{t('actions.backToEvents')}</Link></Button>
      </div>
    );
  }

  if (payment?.status === 'SUCCESS' && event) {
     const formattedDate = getFormattedDateTime(new Date(event.startDateTime), language);
     const eventTitle = getLocalizedTextValue(event.title, language);
     return (
        <div className="text-center" data-testid="payment-success">
            <div className="flex flex-col items-center justify-center gap-4 text-center text-green-600 mb-8">
                <CheckCircle className="h-12 w-12" />
                <h2 className="text-2xl font-semibold">{t('payment.successTitle')}</h2>
                <p className="text-muted-foreground max-w-md mx-auto">{t('payment.successDescription')}</p>
            </div>

            <Card className="text-left">
                <CardHeader>
                    <CardTitle>{t('payment.receiptTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('payment.paymentId')}</span>
                        <span className="font-mono text-sm">{payment.id}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('registration.summary.eventTitle')}</span>
                        <span className="font-semibold">{eventTitle}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('registration.summary.eventDate')}</span>
                        <span className="font-semibold">{formattedDate}</span>
                    </div>
                    {event.type === 'ONLINE' && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-800 dark:text-blue-300">
                           <h4 className="font-semibold mb-2">{t('payment.howToJoinTitle')}</h4>
                           <p className="text-sm">{t('payment.howToJoinDescription')}</p>
                        </div>
                    )}
                    <div className="flex items-center justify-center pt-4">
                        <AddToCalendarButton event={event} />
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-4 mt-8 justify-center">
                <Button variant="outline" asChild><Link href="/events">{t('payment.browseMoreEvents')}</Link></Button>
                <Button asChild><Link href={`/dashboard`}>{t('payment.viewMyRegistrations')}</Link></Button>
            </div>
        </div>
    );
  }
  
   if (payment?.status === 'FAILED') {
     const wizardUrl = getRegistrationWizardUrl(payment.eventId, payment.ticketType, 5);
     return (
      <div className="flex flex-col items-center justify-center gap-4 text-center text-destructive" data-testid="payment-failed">
        <XCircle className="h-12 w-12" />
        <h2 className="text-2xl font-semibold">{t('payment.failedTitle')}</h2>
        <p className="text-muted-foreground max-w-sm">{t('payment.failedDescription')}</p>
        <div className="flex gap-4 mt-4">
            <Button variant="outline" asChild>
                <Link href={wizardUrl}>
                    {t('actions.backToSummary')}
                </Link>
            </Button>
            <Button asChild>
                <Link href={`/payment/mock-gateway?paymentId=${payment.id}`}>
                    {t('actions.retryPayment')}
                </Link>
            </Button>
        </div>
      </div>
    );
  }

  // This state is for when the payment has already been processed but the page is reloaded.
  if (payment) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
            <h2 className="text-2xl font-semibold">{t('payment.alreadyProcessedTitle')}</h2>
            <p>{t('payment.alreadyProcessedDescription')} <span className="font-bold">{payment.status}</span></p>
             <div className="flex gap-4">
                <Button variant="outline" asChild><Link href="/events">{t('payment.browseMoreEvents')}</Link></Button>
                <Button asChild><Link href={`/dashboard`}>{t('payment.viewMyRegistrations')}</Link></Button>
            </div>
        </div>
    );
  }

  return (
     <div className="flex flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">{t('payment.finalizing')}</p>
      </div>
  )
}

export default function PaymentCallbackPage() {
  const { t } = useLanguage();
  return (
    <div className="container flex min-h-[calc(100vh-15rem)] items-center justify-center py-12">
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle>{t('payment.statusTitle')}</CardTitle>
                <CardDescription>{t('payment.statusDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="py-12">
                <Suspense fallback={<div className="flex justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
                    <PaymentCallbackContent />
                </Suspense>
            </CardContent>
        </Card>
    </div>
  );
}
