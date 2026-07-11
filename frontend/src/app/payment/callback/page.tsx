
'use client';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { usePaymentPublicQuery } from '@/hooks/use-payment-queries';
import { useEventQuery } from '@/hooks/use-event-queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, CheckCircle, XCircle, Coins, Sparkles, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-provider';
import { AddToCalendarButton } from '@/components/add-to-calendar-button';
import { getRegistrationWizardUrl, getFormattedDateTime } from '@/lib/event-helpers';
import { getLocalizedTextValue } from '@/lib/i18n/get-localized-text';
import { isCoinCenterEnabled } from '@/lib/config/features';

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const statusParam = searchParams.get('status') || searchParams.get('Status');
  const authority = searchParams.get('Authority');
  const normalizedStatus = statusParam
    ? ((statusParam.toUpperCase() === 'OK' || statusParam.toUpperCase() === 'SUCCESS') ? 'SUCCESS' : 'FAILED')
    : null;
  const { t, language } = useLanguage();

  const { data: payment, isLoading: isLoadingPayment, error: paymentError } = usePaymentPublicQuery(paymentId, {
    status: normalizedStatus ?? undefined,
    authority: authority,
  });
  const { data: event, isLoading: isLoadingEvent } = useEventQuery(payment?.eventId || '');

  useEffect(() => {
    if (!normalizedStatus && payment?.status === 'PENDING' && payment.redirectUrl) {
      window.location.href = payment.redirectUrl;
    }
  }, [normalizedStatus, payment]);

  const isLoading = isLoadingPayment || (payment?.eventId && isLoadingEvent);

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

  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center text-destructive" data-testid="payment-error">
        <AlertTriangle className="h-12 w-12" />
        <h2 className="text-2xl font-semibold">{t('payment.invalidRequestTitle')}</h2>
        <p className="text-muted-foreground">{t('payment.invalidRequestDescription')}</p>
        <Button asChild><Link href="/events">{t('actions.backToEvents')}</Link></Button>
      </div>
    );
  }

  if (!normalizedStatus && payment?.status === 'PENDING') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">{t('payment.finalizing')}</p>
        {payment.redirectUrl && (
          <Button onClick={() => { window.location.href = payment.redirectUrl!; }}>
            {t('registration.summary.paymentButton')}
          </Button>
        )}
      </div>
    );
  }

  if (payment?.status === 'SUCCESS' && event) {
     const formattedDate = getFormattedDateTime(new Date(event.startDateTime), language);
     const eventTitle = getLocalizedTextValue(event.title, language);
     return (
        <div className="w-full max-w-4xl text-center" data-testid="payment-success">
            <div className="flex flex-col items-center justify-center gap-4 text-center text-green-600 mb-8">
                <CheckCircle className="h-12 w-12" />
                <h2 className="text-2xl font-semibold">{t('payment.successTitle')}</h2>
                <p className="text-muted-foreground max-w-md mx-auto">{t('payment.successDescription')}</p>
            </div>

            <Card className="w-full text-left">
                <CardHeader>
                    <CardTitle>{t('payment.receiptTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <span className="text-muted-foreground">{t('payment.paymentId')}</span>
                        <span className="font-mono text-sm break-all sm:text-right">{payment.id}</span>
                    </div>
                     <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <span className="text-muted-foreground">{t('registration.summary.eventTitle')}</span>
                        <span className="font-semibold sm:text-right">{eventTitle}</span>
                    </div>
                     <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <span className="text-muted-foreground">{t('registration.summary.eventDate')}</span>
                        <span className="font-semibold sm:text-right">{formattedDate}</span>
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

            {isCoinCenterEnabled() ? (
              <Card className="mt-6 overflow-hidden border-cyan-500/20 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(135deg,#07111f_0%,#0f172a_55%,#111827_100%)] text-white shadow-xl">
                  <CardContent className="grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-8">
                      <div className="space-y-4 text-left">
                          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                              <Sparkles className="h-3.5 w-3.5" />
                              {t('payment.coinPromoEyebrow')}
                          </div>
                          <div className="space-y-2">
                              <h3 className="text-2xl font-black tracking-tight">{t('payment.coinPromoTitle')}</h3>
                              <p className="max-w-lg text-sm text-slate-300">
                                  {t('payment.coinPromoDescription')}
                              </p>
                          </div>
                          <ul className="space-y-2 text-sm text-slate-200">
                              <li className="flex items-start gap-2">
                                  <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300" />
                                  {t('payment.coinPromoPointOne')}
                              </li>
                              <li className="flex items-start gap-2">
                                  <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300" />
                                  {t('payment.coinPromoPointTwo')}
                              </li>
                          </ul>
                          <div className="flex flex-col gap-3 sm:flex-row">
                              <Button asChild className="bg-cyan-300 font-black text-slate-950 hover:bg-cyan-200">
                                  <Link href="/wallet">
                                      <Coins className="h-4 w-4" />
                                      {t('payment.goToWallet')}
                                  </Link>
                              </Button>
                              <Button variant="outline" asChild className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                                  <Link href="/events">
                                      {t('payment.browseMoreEvents')}
                                      <ArrowRight className="h-4 w-4" />
                                  </Link>
                              </Button>
                          </div>
                      </div>
                      <div className="flex items-center justify-center">
                          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 text-center backdrop-blur">
                              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                                  <Coins className="h-8 w-8" />
                              </div>
                              <p className="text-sm text-slate-300">{t('payment.coinPromoCardLabel')}</p>
                              <p className="mt-2 text-3xl font-black">{t('payment.coinPromoCardTitle')}</p>
                              <p className="mt-3 text-sm text-slate-300">{t('payment.coinPromoCardDescription')}</p>
                          </div>
                      </div>
                  </CardContent>
              </Card>
            ) : (
              <Card className="mt-6 border-border/40 bg-muted/30 shadow-sm">
                  <CardContent className="grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-8">
                      <div className="space-y-3 text-left">
                          <p className="text-xs font-black uppercase tracking-[0.24em] text-muted-foreground">
                              {language === 'fa' ? 'مسیر بعدی' : 'Next steps'}
                          </p>
                          <h3 className="text-2xl font-black tracking-tight">
                              {language === 'fa' ? 'ادامه دهید' : 'Keep going'}
                          </h3>
                          <p className="max-w-lg text-sm text-muted-foreground">
                              {language === 'fa'
                                ? 'می‌توانید رویدادهای بیشتری را بررسی کنید یا به داشبورد خود برگردید.'
                                : 'You can browse more events or head back to your dashboard.'}
                          </p>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                          <Button variant="outline" asChild>
                              <Link href="/events">{t('payment.browseMoreEvents')}</Link>
                          </Button>
                          <Button asChild>
                              <Link href="/dashboard">{t('payment.viewMyRegistrations')}</Link>
                          </Button>
                      </div>
                  </CardContent>
              </Card>
            )}

            <div className="mt-8 flex flex-col gap-4 justify-center sm:flex-row">
                <Button variant="outline" asChild><Link href="/events">{t('payment.browseMoreEvents')}</Link></Button>
                <Button asChild><Link href={`/dashboard`}>{t('payment.viewMyRegistrations')}</Link></Button>
            </div>
        </div>
    );
  }
  
   if (payment?.status === 'FAILED') {
     const wizardUrl = getRegistrationWizardUrl(payment.eventId, payment.ticketType, 5);
     return (
        <div className="w-full max-w-2xl flex flex-col items-center justify-center gap-4 text-center text-destructive" data-testid="payment-failed">
        <XCircle className="h-12 w-12" />
        <h2 className="text-2xl font-semibold">{t('payment.failedTitle')}</h2>
        <p className="text-muted-foreground max-w-sm">{t('payment.failedDescription')}</p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
            <Button variant="outline" asChild>
                <Link href={wizardUrl}>
                    {t('actions.backToSummary')}
                </Link>
            </Button>
            {payment.redirectUrl && (
              <Button onClick={() => { window.location.href = payment.redirectUrl!; }}>
                {t('actions.retryPayment')}
              </Button>
            )}
        </div>
      </div>
    );
  }

  // This state is for when the payment has already been processed but the page is reloaded.
  if (payment) {
    return (
        <div className="w-full max-w-2xl flex flex-col items-center justify-center gap-4 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
            <h2 className="text-2xl font-semibold">{t('payment.alreadyProcessedTitle')}</h2>
            <p>{t('payment.alreadyProcessedDescription')} <span className="font-bold">{payment.status}</span></p>
             <div className="flex flex-col gap-4 sm:flex-row">
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
    <div className="container flex min-h-[calc(100vh-15rem)] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <Card className="w-full max-w-5xl">
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
