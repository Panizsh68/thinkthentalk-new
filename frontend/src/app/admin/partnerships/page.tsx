'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n/language-provider';
import { withRoleGuard } from '@/components/admin/with-role-guard';
import { useAdminCollabsQuery, useAdminSponsorsQuery, useUpdateCollabStatusMutation, useUpdateSponsorStatusMutation } from '@/hooks/use-partnership-queries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Users, Building, Mail, Phone, Clock, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/lib/auth/admin-auth-provider';
import { formatLocalizedDate } from '@/lib/format-date';
import type { ApiError } from '@/lib/api/client';
import type { CollaborationAdminRequest, PartnershipStatus, SponsorshipAdminRequest } from '@/lib/types';
import { PARTNERSHIP_STATUSES } from '@/lib/types';

const PAGE_SIZE = 20;

const statusColors: Record<PartnershipStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  REVIEWING: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-purple-100 text-purple-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

type RequestType = 'collabs' | 'sponsors';
type SelectedRequest = CollaborationAdminRequest | SponsorshipAdminRequest;

const getErrorStatus = (error: unknown): number | undefined => error instanceof Error ? (error as ApiError).status : undefined;
const isNetworkError = (error: unknown): boolean => error instanceof Error && Boolean((error as ApiError).isNetworkError);

function AdminPartnershipsPage() {
  const { t, language } = useLanguage();
  const { currentAdmin } = useAdminAuth();
  const { toast } = useToast();
  const canReviewCollabs = currentAdmin?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<RequestType>('collabs');
  const [collabStatusFilter, setCollabStatusFilter] = useState<PartnershipStatus | undefined>();
  const [sponsorStatusFilter, setSponsorStatusFilter] = useState<PartnershipStatus | undefined>();
  const [collabPage, setCollabPage] = useState(1);
  const [sponsorPage, setSponsorPage] = useState(1);

  const collabQuery = useAdminCollabsQuery(collabStatusFilter, collabPage, PAGE_SIZE, canReviewCollabs);
  const sponsorQuery = useAdminSponsorsQuery(sponsorStatusFilter, undefined, sponsorPage, PAGE_SIZE, Boolean(currentAdmin));
  const { mutate: updateCollab, isPending: updatingCollab } = useUpdateCollabStatusMutation();
  const { mutate: updateSponsor, isPending: updatingSponsor } = useUpdateSponsorStatusMutation();

  const [selectedRequest, setSelectedRequest] = useState<SelectedRequest | null>(null);
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [newStatus, setNewStatus] = useState<PartnershipStatus | ''>('');

  useEffect(() => {
    if (!canReviewCollabs && activeTab === 'collabs') setActiveTab('sponsors');
  }, [activeTab, canReviewCollabs]);

  const closeDialog = () => {
    setSelectedRequest(null);
    setSelectedType(null);
    setStatusNote('');
    setNewStatus('');
  };

  const openRequest = (item: SelectedRequest, type: RequestType) => {
    setSelectedRequest(item);
    setSelectedType(type);
    const latestPublicMessage = type === 'collabs' && 'history' in item
      ? item.history[item.history.length - 1]?.note ?? ''
      : item.adminNote ?? '';
    setStatusNote(latestPublicMessage);
    setNewStatus(item.status);
  };

  const handleStatusChange = (value: string) => {
    if (PARTNERSHIP_STATUSES.includes(value as PartnershipStatus)) setNewStatus(value as PartnershipStatus);
  };

  const handleUpdateStatus = () => {
    if (!selectedRequest || !selectedType || !newStatus) return;
    const payload = { id: selectedRequest.id, status: newStatus, notes: statusNote.trim() || undefined };
    const onSuccess = () => {
      toast({ title: t('admin.partnerships.updateSuccess') });
      closeDialog();
    };
    const onError = (error: unknown) => {
      const status = getErrorStatus(error);
      toast({ variant: 'destructive', title: status === 404 ? t('admin.partnerships.errors.notFound') : status === 403 ? t('admin.partnerships.errors.forbidden') : t('admin.partnerships.errors.update') });
    };
    if (selectedType === 'collabs') updateCollab(payload, { onSuccess, onError });
    else updateSponsor(payload, { onSuccess, onError });
  };

  const renderQueryError = (error: unknown) => {
    const status = getErrorStatus(error);
    const message = status === 403
      ? t('admin.partnerships.errors.forbidden')
      : status === 401
        ? t('admin.partnerships.errors.unauthorized')
        : isNetworkError(error)
          ? t('admin.partnerships.errors.network')
          : t('admin.partnerships.errors.server');
    return <TableRow><TableCell colSpan={5} className="py-10 text-center" role="alert"><div className="flex flex-col items-center gap-3 text-destructive"><AlertTriangle className="h-7 w-7" /><span>{message}</span></div></TableCell></TableRow>;
  };
  const renderEmpty = (filtered: boolean) => <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">{filtered ? t('admin.partnerships.emptyFiltered') : t('admin.partnerships.empty')}</TableCell></TableRow>;

  const renderPagination = (page: number, total: number, onPageChange: (nextPage: number) => void, isFetching: boolean) => {
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (totalPages <= 1 && total === 0) return null;
    return <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4" aria-label={t('admin.partnerships.pagination.label')}><span className="text-sm text-muted-foreground">{t('admin.partnerships.pagination.page', { page, totalPages })}</span><div className="flex items-center gap-2"><Button type="button" variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1 || isFetching} aria-label={t('admin.partnerships.pagination.previous')}><ChevronLeft className="h-4 w-4" />{t('admin.partnerships.pagination.previous')}</Button><Button type="button" variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages || isFetching} aria-label={t('admin.partnerships.pagination.next')}>{t('admin.partnerships.pagination.next')}<ChevronRight className="h-4 w-4" /></Button></div></div>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">{t('admin.partnerships.title')}</h1></div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as RequestType)}>
        <TabsList className={canReviewCollabs ? 'grid w-full max-w-[400px] grid-cols-2' : 'grid w-full max-w-[200px] grid-cols-1'}>
          {canReviewCollabs && <TabsTrigger value="collabs"><Users className="mr-2 h-4 w-4" />{t('admin.partnerships.tabs.collabs')}</TabsTrigger>}
          <TabsTrigger value="sponsors"><Building className="mr-2 h-4 w-4" />{t('admin.partnerships.tabs.sponsors')}</TabsTrigger>
        </TabsList>

        {canReviewCollabs && <TabsContent value="collabs" className="space-y-4">
          <Card><CardHeader><CardTitle>{t('admin.partnerships.collabs.title')}</CardTitle><CardDescription>{t('admin.partnerships.collabs.subtitle')}</CardDescription><div className="max-w-xs"><Label htmlFor="collab-status-filter">{t('admin.partnerships.filters.status')}</Label><Select value={collabStatusFilter ?? 'ALL'} onValueChange={(value) => { setCollabStatusFilter(value === 'ALL' ? undefined : value as PartnershipStatus); setCollabPage(1); }}><SelectTrigger id="collab-status-filter" aria-label={t('admin.partnerships.filters.status')}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">{t('admin.partnerships.filters.all')}</SelectItem>{PARTNERSHIP_STATUSES.map((status) => <SelectItem key={status} value={status}>{t(`partnership.status.${status}`)}</SelectItem>)}</SelectContent></Select></div></CardHeader>
            <CardContent><Table><TableHeader><TableRow><TableHead>{t('admin.registrations.table.user')}</TableHead><TableHead>{t('admin.partnerships.table.expertise')}</TableHead><TableHead>{t('admin.registrations.table.status')}</TableHead><TableHead>{t('admin.registrations.table.date')}</TableHead><TableHead className="text-right">{t('dashboard.table.actions')}</TableHead></TableRow></TableHeader><TableBody>
              {collabQuery.isLoading || collabQuery.isFetching ? <TableRow><TableCell colSpan={5} className="py-10 text-center"><Loader2 className="mx-auto animate-spin" aria-label={t('actions.loading')} /></TableCell></TableRow> : collabQuery.isError ? renderQueryError(collabQuery.error) : collabQuery.data?.items.length ? collabQuery.data.items.map((item) => <TableRow key={item.id}><TableCell><div className="font-medium">{item.name}</div><div className="text-xs text-muted-foreground">{item.email}</div></TableCell><TableCell>{item.fieldOfExpertise}</TableCell><TableCell><Badge className={statusColors[item.status]}>{t(`partnership.status.${item.status}`)}</Badge></TableCell><TableCell className="text-xs">{formatLocalizedDate(item.createdAt, language)}</TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => openRequest(item, 'collabs')}>{t('actions.view')}</Button></TableCell></TableRow>) : renderEmpty(Boolean(collabStatusFilter))}
            </TableBody></Table>{collabQuery.data && renderPagination(collabPage, collabQuery.data.total, setCollabPage, collabQuery.isFetching)}</CardContent>
          </Card>
        </TabsContent>}

        <TabsContent value="sponsors" className="space-y-4">
          <Card><CardHeader><CardTitle>{t('admin.partnerships.sponsors.title')}</CardTitle><CardDescription>{t('admin.partnerships.sponsors.subtitle')}</CardDescription><div className="max-w-xs"><Label htmlFor="sponsor-status-filter">{t('admin.partnerships.filters.status')}</Label><Select value={sponsorStatusFilter ?? 'ALL'} onValueChange={(value) => { setSponsorStatusFilter(value === 'ALL' ? undefined : value as PartnershipStatus); setSponsorPage(1); }}><SelectTrigger id="sponsor-status-filter" aria-label={t('admin.partnerships.filters.status')}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">{t('admin.partnerships.filters.all')}</SelectItem>{PARTNERSHIP_STATUSES.map((status) => <SelectItem key={status} value={status}>{t(`partnership.status.${status}`)}</SelectItem>)}</SelectContent></Select></div></CardHeader>
            <CardContent><Table><TableHeader><TableRow><TableHead>{t('sponsorship.form.companyLabel')}</TableHead><TableHead>{t('admin.partnerships.table.plan')}</TableHead><TableHead>{t('admin.registrations.table.status')}</TableHead><TableHead>{t('admin.registrations.table.date')}</TableHead><TableHead className="text-right">{t('dashboard.table.actions')}</TableHead></TableRow></TableHeader><TableBody>
              {sponsorQuery.isLoading || sponsorQuery.isFetching ? <TableRow><TableCell colSpan={5} className="py-10 text-center"><Loader2 className="mx-auto animate-spin" aria-label={t('actions.loading')} /></TableCell></TableRow> : sponsorQuery.isError ? renderQueryError(sponsorQuery.error) : sponsorQuery.data?.items.length ? sponsorQuery.data.items.map((item) => <TableRow key={item.id}><TableCell><div className="font-medium">{item.companyName}</div><div className="text-xs text-muted-foreground">{item.representativeName}</div></TableCell><TableCell><Badge variant="outline">{t(`sponsorship.plans.${item.plan}.name`)}</Badge></TableCell><TableCell><Badge className={statusColors[item.status]}>{t(`partnership.status.${item.status}`)}</Badge></TableCell><TableCell className="text-xs">{formatLocalizedDate(item.createdAt, language)}</TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => openRequest(item, 'sponsors')}>{t('actions.view')}</Button></TableCell></TableRow>) : renderEmpty(Boolean(sponsorStatusFilter))}
            </TableBody></Table>{sponsorQuery.data && renderPagination(sponsorPage, sponsorQuery.data.total, setSponsorPage, sponsorQuery.isFetching)}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{t('admin.partnerships.detail.title')}</DialogTitle><DialogDescription>{t('admin.partnerships.detail.subtitle')}</DialogDescription></DialogHeader>
          {selectedRequest && <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <Info label={t('contact.form.nameLabel')} value={'fieldOfExpertise' in selectedRequest ? `${selectedRequest.firstName} ${selectedRequest.lastName}` : selectedRequest.representativeName} icon={<Users className="h-4 w-4 text-primary" />} />
              <Info label={t('contact.form.emailLabel')} value={selectedRequest.email} icon={<Mail className="h-4 w-4 text-primary" />} />
              <Info label={t('auth.mobileLabel')} value={selectedRequest.mobile} icon={<Phone className="h-4 w-4 text-primary" />} />
              <Info label={t('admin.registrations.table.date')} value={formatLocalizedDate(selectedRequest.createdAt, language, true)} icon={<Clock className="h-4 w-4 text-primary" />} />
            </div>

            {'fieldOfExpertise' in selectedRequest ? <>
              <Detail label={t('collaborate.form.expertise')} value={selectedRequest.fieldOfExpertise} />
              <Detail label={t('collaborate.form.whyJoin')} value={selectedRequest.whyJoin} preserveWhitespace />
              <Detail label={t('collaborate.form.experience')} value={selectedRequest.experience || t('registration.summary.noInfo')} preserveWhitespace />
              <Detail label={t('collaborate.form.availability')} value={selectedRequest.availability || t('registration.summary.noInfo')} />
              <Detail label={t('collaborate.form.termsStatus')} value={selectedRequest.acceptedTerms ? `${t('collaborate.form.accepted')} (${formatLocalizedDate(selectedRequest.acceptedTermsAt, language, true)})` : t('collaborate.form.notAccepted')} />
            </> : <>
              <Detail label={t('sponsorship.form.companyLabel')} value={selectedRequest.companyName} />
              <Detail label={t('sponsorship.form.nameLabel')} value={selectedRequest.representativeName} />
              <Detail label={t('admin.partnerships.table.plan')} value={t(`sponsorship.plans.${selectedRequest.plan}.name`)} />
              <Detail label={t('sponsorship.form.notes')} value={selectedRequest.description || t('registration.summary.noInfo')} preserveWhitespace />
            </>}

            <Detail label={t('admin.registrations.table.status')} value={t(`partnership.status.${selectedRequest.status}`)} />
            {'fieldOfExpertise' in selectedRequest && <div className="space-y-2 rounded-md border bg-muted/30 p-3"><Label className="text-muted-foreground">{t('partnership.panel.statusHistory')}</Label>{selectedRequest.history.length ? <div className="space-y-2 text-sm">{selectedRequest.history.map((history) => <div key={history.id} className="flex items-start justify-between gap-3"><span>{history.fromStatus ? `${t(`partnership.status.${history.fromStatus}`)} → ` : ''}{t(`partnership.status.${history.toStatus}`)}{history.note ? <span className="block text-xs text-muted-foreground">{history.note}</span> : null}</span><span className="shrink-0 text-xs text-muted-foreground">{formatLocalizedDate(history.createdAt, language, true)}</span></div>)}</div> : <p className="text-sm text-muted-foreground">{t('partnership.panel.noHistory')}</p>}</div>}
            <div className="space-y-4 border-t pt-4"><h4 className="text-sm font-semibold">{t('admin.partnerships.detail.updateStatus')}</h4><div className="grid gap-4 md:grid-cols-2"><div className="space-y-1"><Label htmlFor="partnership-new-status">{t('admin.registrations.table.status')}</Label><Select value={newStatus} onValueChange={handleStatusChange}><SelectTrigger id="partnership-new-status"><SelectValue /></SelectTrigger><SelectContent>{PARTNERSHIP_STATUSES.map((status) => <SelectItem key={status} value={status}>{t(`partnership.status.${status}`)}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label htmlFor="partnership-status-note">{selectedType === 'collabs' ? t('admin.partnerships.detail.publicMessage') : t('admin.partnerships.detail.notes')}</Label><Textarea id="partnership-status-note" placeholder={t('admin.partnerships.detail.notesPlaceholder')} value={statusNote} onChange={(event) => setStatusNote(event.target.value)} /></div></div><p className="text-xs text-muted-foreground">{selectedType === 'collabs' ? t('admin.partnerships.detail.publicMessageHelp') : t('admin.partnerships.detail.privateNoteHelp')}</p></div>
          </div>}
          <DialogFooter><Button variant="ghost" onClick={closeDialog}>{t('actions.cancel')}</Button><Button onClick={handleUpdateStatus} disabled={updatingCollab || updatingSponsor || !newStatus}>{(updatingCollab || updatingSponsor) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t('actions.confirm')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-muted-foreground">{label}</Label><div className="flex items-center gap-2 font-medium">{icon}{value}</div></div>;
}

function Detail({ label, value, preserveWhitespace = false }: { label: string; value: string; preserveWhitespace?: boolean }) {
  return <div className="space-y-2"><Label className="text-muted-foreground">{label}</Label><div className={`rounded-md bg-muted p-3 text-sm ${preserveWhitespace ? 'whitespace-pre-wrap leading-relaxed' : ''}`}>{value}</div></div>;
}

export default withRoleGuard(AdminPartnershipsPage, ['ADMIN', 'FINANCE']);
