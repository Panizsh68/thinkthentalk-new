'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Archive, Check, RefreshCcw, Filter, Inbox } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { ContactMessage, ContactMessageStatus } from '@/lib/types';
import {
  archiveContactMessage,
  getContactMessages,
  updateContactMessageStatus,
} from '@/lib/api/admin-contact';
import { withRoleGuard } from '@/components/admin/with-role-guard';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

interface ContactFilters {
  status: ContactMessageStatus | 'all';
  search: string;
  startDate: string;
  endDate: string;
}

const statusStyles: Record<ContactMessageStatus, string> = {
  NEW: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-100',
  SEEN: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-100',
  ARCHIVED: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
};

function AdminContactPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [filters, setFilters] = useState<ContactFilters>({ status: 'all', search: '', startDate: '', endDate: '' });
  const [searchDraft, setSearchDraft] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ items: ContactMessage[]; total: number; pageSize: number }>({ items: [], total: 0, pageSize: PAGE_SIZE });
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [actionLoading, setActionLoading] = useState<null | 'seen' | 'archive'>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchDraft }));
      setPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchDraft]);

  const totalPages = useMemo(() => {
    if (!data.total) return 1;
    return Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  }, [data.total]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(language === 'fa' ? 'fa-IR' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [language],
  );

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getContactMessages({ ...filters, page, pageSize: PAGE_SIZE });
      setData({ items: response.items, total: response.total, pageSize: response.pageSize });
    } catch (err: any) {
      setError(err?.message ?? t('admin.contact.notifications.error'));
    } finally {
      setIsLoading(false);
    }
  }, [filters, page, t]);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  const resetFilters = () => {
    setFilters({ status: 'all', search: '', startDate: '', endDate: '' });
    setSearchDraft('');
    setPage(1);
  };

  const handleStatusChange = (value: ContactFilters['status']) => {
    setFilters((prev) => ({ ...prev, status: value }));
    setPage(1);
  };

  const handleDateChange = (key: 'startDate' | 'endDate', value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const openDetails = (message: ContactMessage) => {
    setSelected(message);
    setDetailOpen(true);
  };

  const closeDetails = () => {
    setDetailOpen(false);
    setSelected(null);
  };

  const handleMarkSeen = async (message: ContactMessage) => {
    if (message.status !== 'NEW') {
      openDetails(message);
      return;
    }
    setActionLoading('seen');
    try {
      const updated = await updateContactMessageStatus(message.id, 'SEEN');
      toast({ title: t('admin.contact.notifications.statusUpdated') });
      setSelected((prev) => (prev && prev.id === updated.id ? updated : prev));
      await fetchMessages();
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('errors.genericTitle'), description: err?.message ?? t('admin.contact.notifications.error') });
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (message: ContactMessage) => {
    setActionLoading('archive');
    try {
      const updated = await archiveContactMessage(message.id);
      toast({ title: t('admin.contact.notifications.archived') });
      setSelected((prev) => (prev && prev.id === updated.id ? updated : prev));
      await fetchMessages();
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('errors.genericTitle'), description: err?.message ?? t('admin.contact.notifications.error') });
    } finally {
      setActionLoading(null);
    }
  };

  const currentStatusLabel = (status: ContactMessageStatus) => t(`admin.contact.status.${status}`);
  const resolveMessageLanguage = (value?: string) => (value && value.toLowerCase().startsWith('fa') ? 'fa' : 'en');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.contact.title')}</h1>
          <p className="text-muted-foreground">{t('admin.contact.subtitle')}</p>
        </div>
        <Button variant="outline" onClick={() => fetchMessages()} disabled={isLoading}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          {t('admin.contact.refresh')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            {t('admin.contact.filters.status')}
          </CardTitle>
          <CardDescription>{t('admin.contact.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="mb-2 text-sm font-medium">{t('admin.contact.filters.status')}</p>
            <Select value={filters.status} onValueChange={(value) => handleStatusChange(value as ContactFilters['status'])}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.contact.filters.statusAll')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.contact.filters.statusAll')}</SelectItem>
                <SelectItem value="NEW">{currentStatusLabel('NEW')}</SelectItem>
                <SelectItem value="SEEN">{currentStatusLabel('SEEN')}</SelectItem>
                <SelectItem value="ARCHIVED">{currentStatusLabel('ARCHIVED')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <p className="mb-2 text-sm font-medium">{t('admin.contact.filters.searchPlaceholder')}</p>
            <Input
              placeholder={t('admin.contact.filters.searchPlaceholder')}
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-4 md:col-span-2">
            <div className="w-full">
              <p className="mb-2 text-sm font-medium">{t('admin.contact.filters.dateFrom')}</p>
              <Input type="date" value={filters.startDate} onChange={(event) => handleDateChange('startDate', event.target.value)} />
            </div>
            <div className="w-full">
              <p className="mb-2 text-sm font-medium">{t('admin.contact.filters.dateTo')}</p>
              <Input type="date" value={filters.endDate} onChange={(event) => handleDateChange('endDate', event.target.value)} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={resetFilters} disabled={isLoading}>
            {t('admin.contact.filters.reset')}
          </Button>
          <div className="text-sm text-muted-foreground">
            {t('admin.contact.pagination.label', { page, totalPages })}
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.contact.title')}</CardTitle>
          <CardDescription>
            {t('admin.contact.pagination.label', { page, totalPages })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <RefreshCcw className="h-6 w-6 animate-spin" />
            </div>
          ) : data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
              <Inbox className="h-10 w-10" />
              <p>{t('admin.contact.table.empty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.contact.table.createdAt')}</TableHead>
                    <TableHead>{t('admin.contact.table.name')}</TableHead>
                    <TableHead>{t('admin.contact.table.email')}</TableHead>
                    <TableHead>{t('admin.contact.table.message')}</TableHead>
                    <TableHead>{t('admin.contact.table.status')}</TableHead>
                    <TableHead className="text-right">{t('admin.contact.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {dateFormatter.format(new Date(message.createdAt))}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{message.name || '—'}</TableCell>
                      <TableCell className="text-sm" dir="ltr">
                        <a href={`mailto:${message.email}`} className="text-primary underline-offset-4 hover:underline">
                          {message.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        <p
                          className="max-w-md text-sm text-muted-foreground"
                          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                        >
                          {message.message}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs', statusStyles[message.status])}>{currentStatusLabel(message.status)}</Badge>
                      </TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openDetails(message)}>
                          <Eye className="mr-1 h-4 w-4" />
                          {t('admin.contact.view')}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={message.status !== 'NEW' || actionLoading === 'seen'}
                          onClick={() => handleMarkSeen(message)}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          {currentStatusLabel('SEEN')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={message.status === 'ARCHIVED' || actionLoading === 'archive'}
                          onClick={() => handleArchive(message)}
                        >
                          <Archive className="mr-1 h-4 w-4" />
                          {t('admin.contact.detail.markArchived')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {t('admin.contact.pagination.label', { page, totalPages })}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
              {t('admin.contact.pagination.previous')}
            </Button>
            <Button
              variant="ghost"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              {t('admin.contact.pagination.next')}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={detailOpen} onOpenChange={(open) => (open ? setDetailOpen(true) : closeDetails())}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('admin.contact.detail.title')}</DialogTitle>
            <DialogDescription>
              {selected ? `${selected.email} · ${dateFormatter.format(new Date(selected.createdAt))}` : ''}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={cn('text-xs', statusStyles[selected.status])}>{currentStatusLabel(selected.status)}</Badge>
                <Badge variant="secondary">
                  {resolveMessageLanguage(selected.language) === 'fa' ? t('language.fa') : t('language.en')}
                </Badge>
                <Badge variant={selected.emailSent ? 'default' : 'secondary'}>
                  {t('admin.contact.detail.emailSent')}: {selected.emailSent ? t('registration.summary.yes') : t('registration.summary.no')}
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{t('admin.contact.detail.source')}</p>
                  <p className="font-medium">{selected.source}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{t('admin.contact.detail.ip')}</p>
                  <p className="font-medium">{selected.ipAddress || t('registration.summary.noInfo')}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase text-muted-foreground">{t('admin.contact.detail.userAgent')}</p>
                  <p className="font-medium break-words text-sm">
                    {selected.userAgent || t('registration.summary.noInfo')}
                  </p>
                </div>
                {selected.processedAt && (
                  <div className="sm:col-span-2">
                    <p className="text-xs uppercase text-muted-foreground">{t('admin.contact.detail.processedAt')}</p>
                    <p className="font-medium">{dateFormatter.format(new Date(selected.processedAt))}</p>
                  </div>
                )}
              </div>
              <div className="rounded-lg border bg-muted/50 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                {selected.message}
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" onClick={closeDetails}>
              {t('admin.contact.detail.close')}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={!selected || selected.status !== 'NEW' || actionLoading === 'seen'}
                onClick={() => selected && handleMarkSeen(selected)}
              >
                <Check className="mr-1 h-4 w-4" />
                {t('admin.contact.detail.markSeen')}
              </Button>
              <Button
                variant="default"
                disabled={!selected || selected.status === 'ARCHIVED' || actionLoading === 'archive'}
                onClick={() => selected && handleArchive(selected)}
              >
                <Archive className="mr-1 h-4 w-4" />
                {t('admin.contact.detail.markArchived')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withRoleGuard(AdminContactPage, ['ADMIN', 'EVENT_MANAGER', 'FINANCE']);
