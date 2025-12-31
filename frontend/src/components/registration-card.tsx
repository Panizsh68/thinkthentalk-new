
'use client';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { UserRegistration } from '@/lib/types';
import Link from 'next/link';
import { MessageSquareQuote } from 'lucide-react';
import { formatEventDateTimeForCard, getRegistrationWizardUrl, isEventPast } from '@/lib/event-helpers';
import { getLocalizedTextValue } from '@/lib/i18n/get-localized-text';

interface RegistrationCardProps {
  registration: UserRegistration;
}

export function RegistrationCard({ registration }: RegistrationCardProps) {
  const { t, language } = useLanguage();

  const getStatusVariant = (status: 'PAID' | 'PENDING' | 'FAILED' | 'CANCELLED') => {
    switch (status) {
      case 'PAID': return 'default';
      case 'PENDING': return 'secondary';
      case 'FAILED':
      case 'CANCELLED':
        return 'destructive';
      default: return 'outline';
    }
  };
  
  const formattedDate = formatEventDateTimeForCard(new Date(registration.event.startDateTime), language);
  const eventTitle = getLocalizedTextValue(registration.event.title, language);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{eventTitle}</CardTitle>
        <Badge variant={getStatusVariant(registration.status)} className="w-fit">
          {t(`registration.status.${registration.status.toLowerCase()}`)}
        </Badge>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-2">
        <div className="flex justify-between">
          <span>{t('dashboard.table.date')}:</span>
          <span className="font-medium text-foreground">
            {formattedDate}
          </span>
        </div>
        <div className="flex justify-between">
          <span>{t('dashboard.table.ticket')}:</span>
          <span className="font-medium text-foreground">
            {t(`tickets.${registration.ticketType.toLowerCase()}`)}
          </span>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="flex flex-col items-stretch gap-2 pt-4">
        <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" asChild>
            <Link href={`/events/${registration.eventId}`}>{t('actions.viewEvent')}</Link>
            </Button>
            {registration.status === 'PAID' && registration.paymentId && (
            <Button size="sm" asChild>
                <Link href={`/payment/callback?paymentId=${registration.paymentId}`}>{t('actions.viewReceipt')}</Link>
            </Button>
            )}
            {registration.status === 'FAILED' && (
            <Button size="sm" asChild>
                <Link href={getRegistrationWizardUrl(registration.eventId, registration.ticketType, 5)}>
                  {t('actions.retryPayment')}
                </Link>
            </Button>
            )}
        </div>
         {registration.status === 'PAID' && isEventPast({ startDateTime: registration.event.startDateTime }) && (
            <Button size="sm" variant="secondary" asChild>
                <Link href={`/events/${registration.eventId}/evaluation`}>
                    <MessageSquareQuote className="mr-2 h-4 w-4" />
                    {t('actions.leaveFeedback')}
                </Link>
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
