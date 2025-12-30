'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePaymentQuery } from '@/hooks/use-payment-queries';
import { useLanguage } from '@/lib/i18n/language-provider';
import { getFormattedPrice } from '@/lib/event-helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Logo } from '@/components/icons/logo';

function MockGatewayPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const { t } = useLanguage();

  const { data: payment, isLoading, error } = usePaymentQuery(paymentId);

  const handleAction = (status: 'SUCCESS' | 'FAILED') => {
    if (!paymentId) return;
    const callbackUrl = new URL(window.location.origin);
    callbackUrl.pathname = '/payment/callback';
    callbackUrl.searchParams.set('paymentId', paymentId);
    callbackUrl.searchParams.set('status', status);
    callbackUrl.searchParams.set('mockTransactionId', `mock-txn-${Date.now()}`);
    
    router.push(callbackUrl.toString());
  };

  if (isLoading) {
    return <div className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /><span>Loading payment details...</span></div>;
  }

  if (error) {
    return <div className="flex items-center gap-2 text-destructive"><AlertTriangle /><span>Error loading payment: {error.message}</span></div>;
  }

  if (!payment) {
    return <div className="flex items-center gap-2 text-destructive"><AlertTriangle /><span>Payment not found.</span></div>;
  }
  
  if (payment.status !== 'PENDING') {
     return <div className="flex items-center gap-2 text-amber-600"><AlertTriangle /><span>This payment has already been processed.</span></div>;
  }

  return (
    <div className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle>Mock Payment Gateway</CardTitle>
            <Logo className="h-8 w-auto text-primary" />
        </div>
        <CardDescription>This is a simulated payment page.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-baseline rounded-lg border p-4">
            <span className="text-muted-foreground">Amount to pay:</span>
            <span className="text-2xl font-bold">{getFormattedPrice(payment.amount, payment.currency, t)}</span>
        </div>
        <p className="text-sm text-muted-foreground">Click "Pay" to simulate a successful transaction or "Cancel" to simulate a failure.</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-4">
        <Button variant="destructive" onClick={() => handleAction('FAILED')}>
            <XCircle className="mr-2 h-4 w-4" />
            Cancel Payment
        </Button>
        <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleAction('SUCCESS')}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Pay Now
        </Button>
      </CardFooter>
    </div>
  );
}


export default function MockGatewayPage() {
    return (
        <div className="container flex min-h-[calc(100vh-15rem)] items-center justify-center py-12">
            <Card className="w-full max-w-lg">
                <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
                    <MockGatewayPageContent />
                </Suspense>
            </Card>
        </div>
    )
}
