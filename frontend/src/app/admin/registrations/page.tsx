
'use client';
import { useState, useMemo } from 'react';
import { useAllRegistrationsQuery } from '@/hooks/use-admin-registration-queries';
import { useEventsQuery } from '@/hooks/use-event-queries';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { UserRegistrationDetails } from '@/lib/types';
import Link from 'next/link';
import { getFormattedDateTime } from '@/lib/event-helpers';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, AlertTriangle, Filter, X, Calendar as CalendarIcon, User, MessageSquare, MoreHorizontal, Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SendMessageDialog } from '@/components/admin/send-message-dialog';
import { exportToCsv } from '@/lib/csv-export';
import { getLocalizedTextValue } from '@/lib/i18n/get-localized-text';

type RegistrationFilters = {
  eventId?: string;
  status?: 'PAID' | 'PENDING' | 'FAILED' | 'CANCELLED';
  dateRange?: { from?: Date; to?: Date };
};


export default function AdminRegistrationsPage() {
  const { t, language } = useLanguage();
  const { data: registrations, isLoading, error } = useAllRegistrationsQuery();
  const { data: events, isLoading: isLoadingEvents } = useEventsQuery({ showPastEvents: true });
  const [filters, setFilters] = useState<RegistrationFilters>({});

  const filteredRegistrations = useMemo(() => {
    if (!registrations) return [];
    return registrations.filter(reg => {
        const eventMatch = !filters.eventId || reg.eventId === filters.eventId;
        const statusMatch = !filters.status || reg.status === filters.status;
        const regDate = new Date(reg.createdAt);
        const fromMatch = !filters.dateRange?.from || regDate >= filters.dateRange.from;
        const toMatch = !filters.dateRange?.to || regDate <= filters.dateRange.to;
        return eventMatch && statusMatch && fromMatch && toMatch;
    });
  }, [registrations, filters]);

  const handleFilterChange = (key: keyof RegistrationFilters, value: any) => {
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

  const handleDateRangeChange = (range: any) => {
    handleFilterChange('dateRange', range);
  }

  const clearFilters = () => {
    setFilters({});
  }

  const handleExport = () => {
    const dataToExport = filteredRegistrations.map(reg => ({
        id: reg.id,
        userName: `${reg.user.firstNameFa || ''} ${reg.user.lastNameFa || ''}`.trim() || reg.user.mobile,
        mobile: reg.user.mobile,
        event: getLocalizedTextValue(reg.event.title, language),
        ticketType: t(`tickets.${reg.ticketType.toLowerCase()}`),
        status: t(`registration.status.${reg.status.toLowerCase()}`),
        registrationDate: format(new Date(reg.createdAt), 'yyyy-MM-dd HH:mm'),
    }));

    const headers = {
        id: t('admin.export.registrationId'),
        userName: t('admin.export.user'),
        mobile: t('admin.export.mobile'),
        event: t('admin.export.event'),
        ticketType: t('admin.export.ticketType'),
        status: t('admin.export.status'),
        registrationDate: t('admin.export.registrationDate'),
    };
    
    exportToCsv(dataToExport, headers, `registrations_${new Date().toISOString().split('T')[0]}.csv`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.registrations.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('admin.registrations.subtitle')}</p>
        </div>
        <Button onClick={handleExport} disabled={filteredRegistrations.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            {t('admin.export.exportCsv')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">{t('admin.filters.title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
               <SelectValue placeholder={t('admin.registrations.filters.statusPlaceholder')} />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">{t('admin.filters.status.all')}</SelectItem>
               <SelectItem value="PAID">{t('registration.status.paid')}</SelectItem>
               <SelectItem value="PENDING">{t('registration.status.pending')}</SelectItem>
               <SelectItem value="FAILED">{t('registration.status.failed')}</SelectItem>
               <SelectItem value="CANCELLED">{t('registration.status.cancelled')}</SelectItem>
             </SelectContent>
           </Select>
           <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.from ? 
                        filters.dateRange.to ? `${format(filters.dateRange.from, "LLL d")} - ${format(filters.dateRange.to, "LLL d")}`
                        : t('admin.registrations.filters.afterDate', { date: format(filters.dateRange.from, "LLL d") })
                    : filters.dateRange?.to ? t('admin.registrations.filters.beforeDate', { date: format(filters.dateRange.to, "LLL d") })
                    : t('admin.registrations.filters.datePlaceholder')}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="range"
                    selected={filters.dateRange}
                    onSelect={handleDateRangeChange}
                    numberOfMonths={2}
                />
            </PopoverContent>
           </Popover>
        </CardContent>
         <CardFooter>
            <Button variant="ghost" onClick={clearFilters} disabled={Object.keys(filters).length === 0}>
                <X className="mr-2 h-4 w-4" />
                {t('actions.clearFilters')}
            </Button>
        </CardFooter>
      </Card>
      
       {isLoading ? (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-destructive text-center py-8">{t('errors.fetchRegistrations')}</p>
      ) : (
        <>
          <div className="hidden md:block border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.registrations.table.user')}</TableHead>
                  <TableHead>{t('admin.registrations.table.event')}</TableHead>
                  <TableHead>{t('admin.registrations.table.ticket')}</TableHead>
                  <TableHead>{t('admin.registrations.table.status')}</TableHead>
                   <TableHead>{t('admin.registrations.table.date')}</TableHead>
                  <TableHead className="text-right">{t('admin.discounts.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations?.map(reg => <RegistrationTableRow key={reg.id} registration={reg} />)}
              </TableBody>
            </Table>
          </div>
          <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredRegistrations?.map(reg => <RegistrationCardAdmin key={reg.id} registration={reg} />)}
          </div>
           {!isLoading && !error && filteredRegistrations?.length === 0 && (
                <div className="text-center text-muted-foreground py-8 space-y-4">
                    <p>{t('admin.registrations.noRegistrationsFound')}</p>
                    <Button variant="outline" onClick={clearFilters}>{t('actions.clearFilters')}</Button>
                </div>
            )}
        </>
      )}

    </div>
  );
}

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

function RegistrationTableRow({ registration: reg }: { registration: UserRegistrationDetails }) {
    const { t, language } = useLanguage();
    const userName = reg.user.firstNameFa ? `${reg.user.firstNameFa} ${reg.user.lastNameFa}` : reg.user.mobile;
    const formattedDate = getFormattedDateTime(new Date(reg.createdAt), language, 'card');
    return (
        <TableRow>
            <TableCell>
                <div className="font-medium">{userName}</div>
                <div className="text-sm text-muted-foreground">{reg.user.mobile}</div>
            </TableCell>
            <TableCell>{getLocalizedTextValue(reg.event.title, language)}</TableCell>
            <TableCell>{t(`tickets.${reg.ticketType.toLowerCase()}`)}</TableCell>
            <TableCell><Badge variant={getStatusVariant(reg.status)}>{t(`registration.status.${reg.status.toLowerCase()}`)}</Badge></TableCell>
            <TableCell>{formattedDate}</TableCell>
            <TableCell className="text-right">
                <ActionsMenu registration={reg} />
            </TableCell>
        </TableRow>
    )
}

function RegistrationCardAdmin({ registration: reg }: { registration: UserRegistrationDetails }) {
    const { t, language } = useLanguage();
    const userName = reg.user.firstNameFa ? `${reg.user.firstNameFa} ${reg.user.lastNameFa}` : reg.user.mobile;
    const formattedDate = getFormattedDateTime(new Date(reg.createdAt), language, 'card');
    
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{getLocalizedTextValue(reg.event.title, language)}</CardTitle>
                    <ActionsMenu registration={reg} />
                </div>
                <CardDescription>{userName} ({reg.user.mobile})</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                    <span>{t('admin.registrations.table.status')}:</span>
                     <Badge variant={getStatusVariant(reg.status)}>{t(`registration.status.${reg.status.toLowerCase()}`)}</Badge>
                </div>
                 <div className="flex justify-between">
                    <span>{t('admin.registrations.table.ticket')}:</span>
                    <span>{t(`tickets.${reg.ticketType.toLowerCase()}`)}</span>
                </div>
                 <div className="flex justify-between">
                    <span>{t('admin.registrations.table.date')}:</span>
                    <span>{formattedDate}</span>
                </div>
            </CardContent>
        </Card>
    )
}


function ActionsMenu({ registration }: { registration: UserRegistrationDetails }) {
    const { t } = useLanguage();
    const [isMessageOpen, setIsMessageOpen] = useState(false);
    return (
        <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">{t('admin.registrations.actions.openMenu')}</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                   <Link href={`/admin/registrations/${registration.id}`}>
                        <User className="mr-2 h-4 w-4" />
                        <span>{t('admin.registrations.actions.viewUserDetails')}</span>
                    </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem onSelect={() => setIsMessageOpen(true)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>{t('admin.registrations.actions.sendMessage')}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <SendMessageDialog user={registration.user as any} open={isMessageOpen} onOpenChange={setIsMessageOpen} />
        </>
    )
}
