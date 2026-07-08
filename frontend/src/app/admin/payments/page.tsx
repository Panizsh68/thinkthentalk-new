
'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useEventsQuery } from '@/hooks/use-event-queries';
import { useLanguage } from '@/lib/i18n/language-provider';
import { getFormattedPrice, getFormattedDateTime } from '@/lib/event-helpers';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Filter, X, DollarSign, ListChecks, TrendingUp, Eye, Download } from 'lucide-react';
import { withRoleGuard } from '@/components/admin/with-role-guard';
import { exportToCsv } from '@/lib/csv-export';
import { format } from 'date-fns';
import { useAdminPaymentsQuery } from '@/hooks/use-payment-queries';
import type { Payment } from '@/lib/types';
import { getLocalizedTextValue } from '@/lib/i18n/get-localized-text';


type PaymentFilters = {
  eventId?: string;
  status?: 'SUCCESS' | 'PENDING' | 'FAILED';
  dateRange?: { from?: Date; to?: Date };
};

const getStatusVariant = (status: 'SUCCESS' | 'PENDING' | 'FAILED') => {
    switch (status) {
      case 'SUCCESS': return 'default';
      case 'PENDING': return 'secondary';
      case 'FAILED': return 'destructive';
      default: return 'outline';
    }
}

function AdminPaymentsPage() {
  const { t, language } = useLanguage();
  const [filters, setFilters] = useState<PaymentFilters>({});
  
  const { data: payments, isLoading, error } = useAdminPaymentsQuery(filters);
  const { data: events, isLoading: isLoadingEvents } = useEventsQuery({ showPastEvents: true });


  const summaryStats = useMemo(() => {
    if (!payments) return { totalRevenue: 0, paidTransactions: 0, failedTransactions: 0 };
    const totalRevenue = payments.filter(p => p.status === 'SUCCESS').reduce((acc, p) => acc + p.amount, 0);
    const paidTransactions = payments.filter(p => p.status === 'SUCCESS').length;
    const failedTransactions = payments.filter(p => p.status === 'FAILED').length;
    return { totalRevenue, paidTransactions, failedTransactions };
  }, [payments]);

  const handleFilterChange = (key: keyof PaymentFilters, value: any) => {
    setFilters(prev => {
        const newFilters = {...prev};
        if (value === 'all' || value === '') {
            delete newFilters[key];
        } else {
            // @ts-ignore
            newFilters[key] = value;
        }
        return newFilters;
    });
  };

  const clearFilters = () => setFilters({});

  const handleExport = () => {
    if (!payments) return;
    const dataToExport = payments.map(p => ({
        paymentId: p.id,
        user: p.userName ?? p.userMobile ?? '',
        event: p.eventTitle ?? p.eventId,
        registrationId: p.registrationId,
        amount: p.amount,
        currency: p.currency,
        status: t(`admin.payments.status.${p.status.toLowerCase()}`),
        date: format(new Date(p.createdAt), 'yyyy-MM-dd HH:mm'),
    }));

    const headers = {
        paymentId: t('admin.export.paymentId'),
        user: t('admin.payments.table.user'),
        event: t('admin.export.event'),
        registrationId: t('admin.export.registrationId'),
        amount: t('admin.export.amount'),
        currency: t('admin.export.currency'),
        status: t('admin.export.status'),
        date: t('admin.export.date'),
    };
    
    exportToCsv(dataToExport, headers, `payments_${new Date().toISOString().split('T')[0]}.csv`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.payments.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('admin.payments.subtitle')}</p>
        </div>
        <Button onClick={handleExport} disabled={!payments || payments.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            {t('admin.export.exportCsv')}
        </Button>
      </div>

       {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title={t('admin.payments.totalRevenue')} value={getFormattedPrice(summaryStats.totalRevenue, 'TOMAN', t)} icon={DollarSign} />
        <StatCard title={t('admin.payments.paidTransactions')} value={summaryStats.paidTransactions} icon={ListChecks} />
        <StatCard title={t('admin.payments.failedTransactions')} value={summaryStats.failedTransactions} icon={TrendingUp} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">{t('admin.filters.title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
           <Select value={filters.eventId || 'all'} onValueChange={(v) => handleFilterChange('eventId', v)}>
             <SelectTrigger disabled={isLoadingEvents}>
               <SelectValue placeholder={t('admin.registrations.filters.eventPlaceholder')} />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">{t('admin.registrations.filters.allEvents')}</SelectItem>
               {events?.map(event => {
                  const eventLabel = getLocalizedTextValue(event.title, language);
                  return (
                    <SelectItem key={event.id} value={event.id}>
                      {eventLabel}
                    </SelectItem>
                  );
                })}
             </SelectContent>
           </Select>
           <Select value={filters.status || 'all'} onValueChange={(v) => handleFilterChange('status', v)}>
             <SelectTrigger>
               <SelectValue placeholder={t('admin.payments.filters.statusPlaceholder')} />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">{t('admin.filters.status.all')}</SelectItem>
               <SelectItem value="SUCCESS">{t('admin.payments.status.success')}</SelectItem>
               <SelectItem value="PENDING">{t('admin.payments.status.pending')}</SelectItem>
               <SelectItem value="FAILED">{t('admin.payments.status.failed')}</SelectItem>
             </SelectContent>
           </Select>
        </CardContent>
         <CardFooter>
            <Button variant="ghost" onClick={clearFilters} disabled={Object.keys(filters).length === 0}>
                <X className="mr-2 h-4 w-4" />
                {t('actions.clearFilters')}
            </Button>
        </CardFooter>
      </Card>
      
       {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : error ? (
        <p className="text-destructive text-center py-8">{t('errors.fetchRegistrations')}</p>
      ) : (
        <>
          <div className="hidden md:block border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.payments.table.user')}</TableHead>
                  <TableHead>{t('admin.payments.table.event')}</TableHead>
                  <TableHead>{t('admin.payments.table.amount')}</TableHead>
                  <TableHead>{t('admin.payments.table.status')}</TableHead>
                  <TableHead>{t('admin.payments.table.date')}</TableHead>
                  <TableHead className="text-right">{t('admin.discounts.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments?.map(p => <PaymentTableRow key={p.id} payment={p} t={t} language={language} />)}
              </TableBody>
            </Table>
          </div>
          <div className="grid grid-cols-1 gap-4 md:hidden">
              {payments?.map(p => <PaymentCardAdmin key={p.id} payment={p} t={t} language={language} />)}
          </div>
           {!isLoading && !error && payments?.length === 0 && (
            <div className="text-center text-muted-foreground py-8 space-y-4">
              <p>{t('admin.payments.noPaymentsFound')}</p>
              <Button variant="outline" onClick={clearFilters}>{t('actions.clearFilters')}</Button>
            </div>
           )}
        </>
      )}
    </div>
  );
}

export default withRoleGuard(AdminPaymentsPage, ['ADMIN', 'FINANCE']);

function PaymentTableRow({ payment: p, t, language }: { payment: any, t: (key: string, options?: any) => string, language: 'fa' | 'en' }) {
    const formattedDate = getFormattedDateTime(new Date(p.createdAt), language);
    return (
        <TableRow>
            <TableCell>
                <div className="font-medium">{p.userName ?? p.userMobile ?? '—'}</div>
                <div className="text-xs text-muted-foreground">{p.userMobile ?? ''}</div>
            </TableCell>
            <TableCell>{p.eventTitle ?? p.eventId}</TableCell>
            <TableCell>{getFormattedPrice(p.amount, p.currency, t)}</TableCell>
            <TableCell><Badge variant={getStatusVariant(p.status)}>{t(`admin.payments.status.${p.status.toLowerCase()}`)}</Badge></TableCell>
            <TableCell>{formattedDate}</TableCell>
            <TableCell className="text-right">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/registrations/${p.registrationId}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        {t('admin.payments.actions.viewRegistration')}
                    </Link>
                </Button>
            </TableCell>
        </TableRow>
    )
}

function PaymentCardAdmin({ payment: p, t, language }: { payment: any, t: (key: string, options?: any) => string, language: 'fa' | 'en' }) {
    const formattedDate = getFormattedDateTime(new Date(p.createdAt), language);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{p.eventTitle ?? p.eventId}</CardTitle>
                <CardDescription>{p.userName ?? p.userMobile ?? '—'}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('admin.payments.table.amount')}:</span>
                    <span className="font-semibold">{getFormattedPrice(p.amount, p.currency, t)}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('admin.payments.table.status')}:</span>
                    <Badge variant={getStatusVariant(p.status)}>{t(`admin.payments.status.${p.status.toLowerCase()}`)}</Badge>
                </div>
                <div className="text-muted-foreground text-xs pt-1">
                    {formattedDate}
                </div>
            </CardContent>
            <CardFooter>
                 <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/admin/registrations/${p.registrationId}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        {t('admin.payments.actions.viewRegistration')}
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

function StatCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType; }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    )
}
