
'use client';

import { useState } from 'react';
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
import { Loader2, Users, Building, Mail, Phone, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { PartnershipStatus } from '@/lib/types';

const statusColors: Record<PartnershipStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  REVIEWING: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-purple-100 text-purple-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

function AdminPartnershipsPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('collabs');
  const [collabStatusFilter, setCollabStatusFilter] = useState<PartnershipStatus | undefined>(undefined);
  const [sponsorStatusFilter, setSponsorStatusFilter] = useState<PartnershipStatus | undefined>(undefined);

  const { data: collabs, isLoading: loadingCollabs } = useAdminCollabsQuery(collabStatusFilter);
  const { data: sponsors, isLoading: loadingSponsors } = useAdminSponsorsQuery(sponsorStatusFilter);

  const { mutate: updateCollab, isPending: updatingCollab } = useUpdateCollabStatusMutation();
  const { mutate: updateSponsor, isPending: updatingSponsor } = useUpdateSponsorStatusMutation();

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [statusNote, setStatusNote] = useState('');
  const [newStatus, setNewStatus] = useState<PartnershipStatus | ''>('');

  const handleUpdateStatus = () => {
    if (!selectedRequest || !newStatus) return;

    const mutate = activeTab === 'collabs' ? updateCollab : updateSponsor;
    mutate({ id: selectedRequest.id, status: newStatus as PartnershipStatus, notes: statusNote }, {
      onSuccess: () => {
        toast({ title: t('admin.partnerships.updateSuccess') });
        setSelectedRequest(null);
        setStatusNote('');
        setNewStatus('');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('admin.partnerships.title')}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="collabs"><Users className="w-4 h-4 mr-2 ml-2" /> {t('admin.partnerships.tabs.collabs')}</TabsTrigger>
          <TabsTrigger value="sponsors"><Building className="w-4 h-4 mr-2 ml-2" /> {t('admin.partnerships.tabs.sponsors')}</TabsTrigger>
        </TabsList>

        <TabsContent value="collabs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.partnerships.collabs.title')}</CardTitle>
              <CardDescription>{t('admin.partnerships.collabs.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.registrations.table.user')}</TableHead>
                    <TableHead>{t('admin.partnerships.table.expertise')}</TableHead>
                    <TableHead>{t('admin.registrations.table.status')}</TableHead>
                    <TableHead>{t('admin.registrations.table.date')}</TableHead>
                    <TableHead className="text-right">{t('dashboard.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingCollabs ? <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> :
                    collabs?.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.email}</div>
                        </TableCell>
                        <TableCell>{item.fieldOfExpertise}</TableCell>
                        <TableCell><Badge className={statusColors[item.status]}>{t(`partnership.status.${item.status}`)}</Badge></TableCell>
                        <TableCell className="text-xs">{format(new Date(item.createdAt), 'yyyy/MM/dd')}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(item)}>{t('actions.view')}</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sponsors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.partnerships.sponsors.title')}</CardTitle>
              <CardDescription>{t('admin.partnerships.sponsors.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('sponsorship.form.companyLabel')}</TableHead>
                    <TableHead>{t('admin.partnerships.table.plan')}</TableHead>
                    <TableHead>{t('admin.registrations.table.status')}</TableHead>
                    <TableHead>{t('admin.registrations.table.date')}</TableHead>
                    <TableHead className="text-right">{t('dashboard.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingSponsors ? <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> :
                    sponsors?.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.companyName}</div>
                          <div className="text-xs text-muted-foreground">{item.representativeName}</div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{item.plan}</Badge></TableCell>
                        <TableCell><Badge className={statusColors[item.status]}>{t(`partnership.status.${item.status}`)}</Badge></TableCell>
                        <TableCell className="text-xs">{format(new Date(item.createdAt), 'yyyy/MM/dd')}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(item)}>{t('actions.view')}</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('admin.partnerships.detail.title')}</DialogTitle>
            <DialogDescription>{t('admin.partnerships.detail.subtitle')}</DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">{t('contact.form.nameLabel')}</Label>
                  <div className="flex items-center gap-2 font-medium">
                    <Users className="w-4 h-4 text-primary" /> {selectedRequest.name || selectedRequest.representativeName}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">{t('contact.form.emailLabel')}</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" /> {selectedRequest.email}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">{t('auth.mobileLabel')}</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" /> {selectedRequest.mobile}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">{t('admin.registrations.table.date')}</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> {format(new Date(selectedRequest.createdAt), 'PPP')}
                  </div>
                </div>
              </div>

              {selectedRequest.fieldOfExpertise && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t('collaborate.form.expertise')}</Label>
                  <div className="p-3 bg-muted rounded-md text-sm">{selectedRequest.fieldOfExpertise}</div>
                </div>
              )}

              {selectedRequest.plan && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t('admin.partnerships.table.plan')}</Label>
                  <Badge variant="outline" className="ml-2">{selectedRequest.plan}</Badge>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-muted-foreground">{t('admin.partnerships.detail.content')}</Label>
                <div className="p-4 border rounded-md text-sm whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {selectedRequest.whyJoin || selectedRequest.description || t('registration.summary.noInfo')}
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                <h4 className="font-semibold text-sm">{t('admin.partnerships.detail.updateStatus')}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>{t('admin.registrations.table.status')}</Label>
                    <Select value={newStatus} onValueChange={(v: any) => setNewStatus(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">{t('partnership.status.PENDING')}</SelectItem>
                        <SelectItem value="REVIEWING">{t('partnership.status.REVIEWING')}</SelectItem>
                        <SelectItem value="CONTACTED">{t('partnership.status.CONTACTED')}</SelectItem>
                        <SelectItem value="ACCEPTED">{t('partnership.status.ACCEPTED')}</SelectItem>
                        <SelectItem value="REJECTED">{t('partnership.status.REJECTED')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>{t('admin.partnerships.detail.notes')}</Label>
                    <Textarea 
                      placeholder={t('admin.partnerships.detail.notesPlaceholder')}
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      className="h-10 min-h-[40px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedRequest(null)}>{t('actions.back')}</Button>
            <Button onClick={handleUpdateStatus} disabled={updatingCollab || updatingSponsor || !newStatus}>
              {(updatingCollab || updatingSponsor) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('actions.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withRoleGuard(AdminPartnershipsPage, ['ADMIN', 'EVENT_MANAGER', 'FINANCE']);
