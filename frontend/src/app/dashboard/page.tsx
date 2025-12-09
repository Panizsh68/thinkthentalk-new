
'use client';
import { useAuth } from '@/lib/auth/auth-provider';
import { useUserRegistrationsQuery } from '@/hooks/use-registration-queries';
import { Loader2, AlertTriangle, MessageSquareQuote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-provider';
import { RegistrationCard } from '@/components/registration-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { isEventPast } from '@/lib/event-helpers';
import { formatEventDateTimeForCard } from '@/lib/event-helpers';
import { getLocalizedTextValue } from '@/lib/i18n/get-localized-text';

export default function UserDashboardPage() {
  const { t, language } = useLanguage();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const { data: registrations, isLoading: isLoadingRegistrations, error, refetch } = useUserRegistrationsQuery(currentUser?.id);

  const isLoading = isAuthLoading || isLoadingRegistrations;

  const getStatusVariant = (status: 'PAID' | 'PENDING' | 'FAILED' | 'CANCELLED') => {
    switch (status) {
      case 'PAID': return 'default';
      case 'PENDING': return 'secondary';
      case 'FAILED':
      case 'CANCELLED':
        return 'destructive';
      default: return 'outline';
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive gap-4">
        <AlertTriangle className="h-8 w-8" />
        <p>{t('errors.fetchRegistrations')}</p>
        <Button onClick={() => refetch()} variant="outline">
          {t('actions.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('dashboard.myRegistrations')}</h1>
      <p className="mt-2 text-muted-foreground">{t('dashboard.myRegistrationsSubtitle')}</p>
      
      <div className="mt-6">
        {registrations && registrations.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('dashboard.table.event')}</TableHead>
                    <TableHead>{t('dashboard.table.date')}</TableHead>
                    <TableHead>{t('dashboard.table.ticket')}</TableHead>
                    <TableHead className="text-center">{t('dashboard.table.status')}</TableHead>
                    <TableHead className="text-right">{t('dashboard.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((reg) => {
                    const eventTitle = getLocalizedTextValue(reg.event.title, language);
                    return (
                    <TableRow key={reg.id}>
                      <TableCell className="font-medium">{eventTitle}</TableCell>
                      <TableCell>{formatEventDateTimeForCard(reg.event.startDateTime, language)}</TableCell>
                      <TableCell>{t(`tickets.${reg.ticketType.toLowerCase()}`)}</TableCell>
                      <TableCell className="text-center">
                         <Badge variant={getStatusVariant(reg.status)}>{t(`registration.status.${reg.status.toLowerCase()}`)}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" asChild>
                           <Link href={`/events/${reg.eventId}`}>{t('actions.viewEvent')}</Link>
                        </Button>
                        {reg.status === 'PAID' && (
                           <Button size="sm" asChild>
                              <Link href={`/payment/callback?paymentId=${reg.paymentId}`}>{t('actions.viewReceipt')}</Link>
                           </Button>
                        )}
                        {reg.status === 'PAID' && isEventPast({ startDateTime: reg.event.startDateTime }) && (
                           <Button size="sm" variant="secondary" asChild>
                                <Link href={`/events/${reg.eventId}/evaluation`}>
                                    <MessageSquareQuote className="mr-2 h-4 w-4" />
                                    {t('actions.leaveFeedback')}
                                </Link>
                           </Button>
                        )}
                         {reg.status === 'FAILED' && (
                           <Button size="sm" asChild>
                              <Link href={`/payment/mock-gateway?paymentId=${reg.paymentId}`}>{t('actions.retryPayment')}</Link>
                           </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </div>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {registrations.map((reg) => (
                <RegistrationCard key={reg.id} registration={reg} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg text-muted-foreground">
            <p>{t('dashboard.noRegistrations')}</p>
            <Button variant="link" asChild className="mt-2">
                <Link href="/events">{t('dashboard.browseEvents')}</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
