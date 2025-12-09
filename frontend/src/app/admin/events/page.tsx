
'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAdminEventsQuery, useArchiveEventMutation, useDeleteEventMutation } from '@/hooks/use-event-queries';
import { useLanguage } from '@/lib/i18n/language-provider';
import { isEventPast, getFormattedDateTime } from '@/lib/event-helpers';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Edit, Ticket, FolderKanban, MoreHorizontal, Filter, X, MessageSquareQuote, Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import type { Event } from '@/lib/types';
import { cn } from '@/lib/utils';
import { withRoleGuard } from '@/components/admin/with-role-guard';
import { getLocalizedTextValue } from '@/lib/i18n/get-localized-text';


type AdminEventFilters = {
  status: 'all' | 'upcoming' | 'past';
  type: 'all' | 'ONLINE' | 'OFFLINE';
  archived: 'all' | 'true' | 'false';
  deleted: 'all' | 'true' | 'false';
};

function AdminEventsPage() {
  const { t, language } = useLanguage();
  const [filters, setFilters] = useState<AdminEventFilters>({ status: 'all', type: 'all', archived: 'false', deleted: 'false' });

  const queryParams = useMemo(() => ({
    status: filters.status === 'all' ? undefined : filters.status,
    type: filters.type === 'all' ? undefined : filters.type,
    archived: filters.archived,
    deleted: filters.deleted,
    sortBy: 'startDateTime',
    sortOrder: 'desc',
  }), [filters]);

  const { data: eventsData, isLoading, error } = useAdminEventsQuery(queryParams);
  const events = eventsData || [];


  const handleFilterChange = (key: keyof AdminEventFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value as any }));
  }

  const clearFilters = () => {
    setFilters({ status: 'all', type: 'all', archived: 'false', deleted: 'false' });
  }

  const isRTL = language === 'fa';

  return (
    <div className="space-y-6">
      <div className={cn("flex items-center justify-between", isRTL && "text-right flex-row-reverse")}>
        <div>
          <h1 className="text-2xl font-bold">{t('admin.events.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('admin.events.subtitle')}</p>
        </div>
        <Link href="/admin/events/new" data-testid="create-event-button">
          <Button>
            <PlusCircle className={cn(isRTL ? "ml-2" : "mr-2", "h-4 w-4")} />
            {t('admin.events.createNew')}
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <Card dir={isRTL ? 'rtl' : 'ltr'}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">{t('admin.filters.title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
            <SelectTrigger data-testid="event-status-filter">
              <SelectValue placeholder={t('admin.filters.status.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.filters.status.all')}</SelectItem>
              <SelectItem value="upcoming">{t('admin.filters.status.upcoming')}</SelectItem>
              <SelectItem value="past">{t('admin.filters.status.past')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.type} onValueChange={(v) => handleFilterChange('type', v)}>
            <SelectTrigger data-testid="event-type-filter">
              <SelectValue placeholder={t('admin.filters.type.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.all')}</SelectItem>
              <SelectItem value="ONLINE">{t('event.online')}</SelectItem>
              <SelectItem value="OFFLINE">{t('event.offline')}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-0">
          <Select value={filters.archived} onValueChange={(v) => handleFilterChange('archived', v)}>
            <SelectTrigger data-testid="event-archived-filter">
              <SelectValue placeholder={t('admin.filters.archived.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">{t('admin.filters.archived.active')}</SelectItem>
              <SelectItem value="true">{t('admin.filters.archived.archived')}</SelectItem>
              <SelectItem value="all">{t('admin.filters.archived.all')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.deleted} onValueChange={(v) => handleFilterChange('deleted', v)}>
            <SelectTrigger data-testid="event-deleted-filter">
              <SelectValue placeholder={t('admin.filters.deleted.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">{t('admin.filters.deleted.active')}</SelectItem>
              <SelectItem value="true">{t('admin.filters.deleted.deleted')}</SelectItem>
              <SelectItem value="all">{t('admin.filters.deleted.all')}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
        <CardFooter className={cn(isRTL && "justify-end")}>
          <Button
            variant="ghost"
            onClick={clearFilters}
            disabled={
              filters.status === 'all' &&
              filters.type === 'all' &&
              filters.archived === 'false' &&
              filters.deleted === 'false'
            }
          >
            <X className={cn(isRTL ? "ml-2" : "mr-2", "h-4 w-4")} />
            {t('actions.clearFilters')}
          </Button>
        </CardFooter>
      </Card>


      {/* Events Display */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : error ? (
        <p className="text-destructive">{t('errors.fetchEvents')}</p>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block border rounded-lg" data-testid="admin-events-table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={cn(isRTL && "text-right")}>{t('admin.events.table.title')}</TableHead>
                  <TableHead className={cn(isRTL && "text-right")}>{t('admin.events.table.date')}</TableHead>
                  <TableHead className={cn(isRTL && "text-right")}>{t('admin.events.table.type')}</TableHead>
                  <TableHead className={cn(isRTL && "text-right")}>{t('admin.events.table.status')}</TableHead>
                  <TableHead className={cn(isRTL && "text-right")}>{t('admin.events.table.capacity')}</TableHead>
                  <TableHead className={cn(isRTL && "text-right")}>{t('admin.events.table.state')}</TableHead>
                  <TableHead className={cn("text-right", isRTL && "text-left")}>{t('dashboard.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events?.map(event => <EventTableRow key={event.id} event={event} />)}
              </TableBody>
            </Table>
          </div>
          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {events?.map(event => <EventCardAdmin key={event.id} event={event} />)}
          </div>
        </>
      )}

      {!isLoading && !error && events?.length === 0 && (
        <div className="text-center text-muted-foreground py-8 space-y-4">
          <p>{t('events.noEventsFound')}</p>
          <Button variant="outline" onClick={clearFilters}>{t('actions.clearFilters')}</Button>
        </div>
      )}
    </div>
  );
}

export default withRoleGuard(AdminEventsPage, ['ADMIN', 'EVENT_MANAGER']);


function EventTableRow({ event }: { event: Event }) {
  const { t, language } = useLanguage();
  const past = isEventPast(event);
  const formattedDate = getFormattedDateTime(new Date(event.startDateTime), language);
  const isRTL = language === 'fa';
  const eventTitle = getLocalizedTextValue(event.title, language);
  return (
    <TableRow data-testid={`admin-event-row-${event.id}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <TableCell className="font-medium">{eventTitle}</TableCell>
      <TableCell>{formattedDate}</TableCell>
      <TableCell>
        <Badge variant="outline">{event.type === 'ONLINE' ? t('event.online') : t('event.offline')}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant={past ? 'secondary' : 'default'}>
          {past ? t('event.finished') : t('event.upcoming')}
        </Badge>
      </TableCell>
      <TableCell>
        {event.capacityRemaining} / {event.capacityTotal}
      </TableCell>
      <TableCell>
        <EventStateBadges event={event} />
      </TableCell>
      <TableCell className="text-right">
        <ActionsMenu event={event} />
      </TableCell>
    </TableRow>
  )
}

function EventCardAdmin({ event }: { event: Event }) {
  const { t, language } = useLanguage();
  const past = isEventPast(event);
  const formattedDate = getFormattedDateTime(new Date(event.startDateTime), language);
  const isRTL = language === 'fa';
  const eventTitle = getLocalizedTextValue(event.title, language);

  return (
    <Card data-testid={`admin-event-card-${event.id}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{eventTitle}</CardTitle>
          <ActionsMenu event={event} />
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Badge variant={past ? 'secondary' : 'default'}>
            {past ? t('event.finished') : t('event.upcoming')}
          </Badge>
          <Badge variant="outline">{event.type === 'ONLINE' ? t('event.online') : t('event.offline')}</Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        <p>{formattedDate}</p>
        <p>{t('admin.events.table.capacity')}: {event.capacityRemaining} / {event.capacityTotal}</p>
        <EventStateBadges event={event} />
      </CardContent>
    </Card>
  )
}

function EventStateBadges({ event }: { event: Event }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-wrap gap-2">
      {event.deletedAt && (
        <Badge variant="destructive">{t('admin.events.state.deleted')}</Badge>
      )}
      {event.isArchived && !event.deletedAt && (
        <Badge variant="secondary">{t('admin.events.state.archived')}</Badge>
      )}
      {!event.isArchived && !event.deletedAt && (
        <Badge variant="outline">{t('admin.events.state.active')}</Badge>
      )}
    </div>
  );
}

function ActionsMenu({ event }: { event: Event }) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const archiveMutation = useArchiveEventMutation();
  const deleteMutation = useDeleteEventMutation();
  const isRTL = language === 'fa';
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permanentDelete, setPermanentDelete] = useState(false);

  const handleArchive = () => {
    archiveMutation.mutate(
      { eventId: event.id, archived: !event.isArchived },
      {
        onSuccess: (updatedEvent) => {
          toast({
            title: t(updatedEvent.isArchived ? 'admin.events.archiveSuccess' : 'admin.events.unarchiveSuccess'),
            description: getLocalizedTextValue(updatedEvent.title, language),
          });
          setArchiveDialogOpen(false);
        },
        onError: (error: any) => {
          toast({
            variant: 'destructive',
            title: t('errors.genericTitle'),
            description: error.message,
          });
        },
      },
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(
      { eventId: event.id, force: permanentDelete },
      {
        onSuccess: () => {
          toast({
            title: t(permanentDelete ? 'admin.events.deleteSuccessPermanent' : 'admin.events.deleteSuccess'),
            description: getLocalizedTextValue(event.title, language),
          });
          setDeleteDialogOpen(false);
          setPermanentDelete(false);
        },
        onError: (error: any) => {
          toast({
            variant: 'destructive',
            title: t('errors.genericTitle'),
            description: error.message,
          });
        },
      },
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`event-actions-menu-${event.id}`}>
            <span className="sr-only">{t('dashboard.table.actions')}</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
        <DropdownMenuItem asChild>
          <Link href={`/admin/events/${event.id}/edit`}>
            <Edit className={cn(isRTL ? "ml-2" : "mr-2", "h-4 w-4")} />
            <span>{t('admin.actions.edit')}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/events/${event.id}/tickets`}>
            <Ticket className={cn(isRTL ? "ml-2" : "mr-2", "h-4 w-4")} />
            <span>{t('admin.actions.manageTickets')}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/events/${event.id}/resources`}>
            <FolderKanban className={cn(isRTL ? "ml-2" : "mr-2", "h-4 w-4")} />
            <span>{t('admin.actions.manageResources')}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/events/${event.id}/feedback`}>
            <MessageSquareQuote className={cn(isRTL ? "ml-2" : "mr-2", "h-4 w-4")} />
            <span>{t('admin.actions.manageFeedback')}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setArchiveDialogOpen(true);
          }}
        >
          {event.isArchived ? (
            <>
              <ArchiveRestore className={cn(isRTL ? 'ml-2' : 'mr-2', 'h-4 w-4')} />
              <span>{t('admin.events.actions.unarchive')}</span>
            </>
          ) : (
            <>
              <Archive className={cn(isRTL ? 'ml-2' : 'mr-2', 'h-4 w-4')} />
              <span>{t('admin.events.actions.archive')}</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={(e) => {
            e.preventDefault();
            setDeleteDialogOpen(true);
          }}
        >
          <Trash2 className={cn(isRTL ? 'ml-2' : 'mr-2', 'h-4 w-4')} />
          <span>{t('admin.events.actions.delete')}</span>
        </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader className={cn(isRTL && 'text-right')}>
            <AlertDialogTitle>
              {event.isArchived ? t('admin.events.confirm.unarchiveTitle') : t('admin.events.confirm.archiveTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {event.isArchived
                ? t('admin.events.confirm.unarchiveDescription')
                : t('admin.events.confirm.archiveDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={cn(isRTL && 'flex-row-reverse')}>
            <AlertDialogCancel>{t('admin.resources.form.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={archiveMutation.isPending}
            >
              {event.isArchived ? t('admin.events.actions.unarchive') : t('admin.events.actions.archive')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setPermanentDelete(false); }}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader className={cn(isRTL && 'text-right')}>
            <AlertDialogTitle>{t('admin.events.confirm.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.events.confirm.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className={cn('flex items-start space-x-2 py-4', isRTL && 'space-x-reverse')}>
            <Checkbox
              id={`permanent-delete-${event.id}`}
              checked={permanentDelete}
              onCheckedChange={(checked) => setPermanentDelete(Boolean(checked))}
            />
            <label htmlFor={`permanent-delete-${event.id}`} className="text-sm leading-relaxed">
              {t('admin.events.confirm.permanentCheckbox')}
            </label>
          </div>
          <AlertDialogFooter className={cn(isRTL && 'flex-row-reverse')}>
            <AlertDialogCancel>{t('admin.resources.form.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {permanentDelete ? t('admin.events.actions.deletePermanent') : t('admin.events.actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
