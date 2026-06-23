
'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useAdminIdeasQuery, useUpdateIdeaStatusMutation, useDeleteIdeaMutation } from '@/hooks/use-event-idea-queries';
import { withRoleGuard } from '@/components/admin/with-role-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { EventIdeaStatus, EventIdeaType } from '@/lib/types';

function AdminIdeasPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [filters, setFilters] = useState({ status: undefined as EventIdeaStatus | undefined, type: undefined as EventIdeaType | undefined });

  const { data, isLoading } = useAdminIdeasQuery(filters);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateIdeaStatusMutation();
  const { mutate: deleteIdea, isPending: isDeleting } = useDeleteIdeaMutation();

  const handleStatusChange = (id: string, status: EventIdeaStatus) => {
    updateStatus({ id, status }, {
      onSuccess: () => toast({ title: t('admin.ideas.statusUpdated') }),
    });
  };

  const statusStyles: Record<EventIdeaStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    REVIEWED: 'bg-blue-100 text-blue-800',
    PLANNED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('admin.nav.ideas')}</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('admin.filters.title')}</CardTitle></CardHeader>
        <CardContent className="flex gap-4">
          <Select onValueChange={(v) => setFilters(f => ({ ...f, status: v === 'all' ? undefined : (v as EventIdeaStatus) }))}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('admin.registrations.filters.statusPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.filters.all')}</SelectItem>
              <SelectItem value="PENDING">{t('ideas.status.PENDING')}</SelectItem>
              <SelectItem value="REVIEWED">{t('ideas.status.REVIEWED')}</SelectItem>
              <SelectItem value="PLANNED">{t('ideas.status.PLANNED')}</SelectItem>
              <SelectItem value="REJECTED">{t('ideas.status.REJECTED')}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('ideas.form.titleLabel')}</TableHead>
                  <TableHead>{t('ideas.form.typeLabel')}</TableHead>
                  <TableHead>{t('admin.registrations.table.user')}</TableHead>
                  <TableHead>{t('admin.registrations.table.status')}</TableHead>
                  <TableHead className="text-right">{t('dashboard.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((idea) => (
                  <TableRow key={idea.id}>
                    <TableCell className="max-w-[200px] truncate" title={idea.title}>
                      <div className="font-medium">{idea.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{idea.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{t(`ideas.types.${idea.type}`)}</Badge>
                    </TableCell>
                    <TableCell>
                      {idea.user ? `${idea.user.firstNameFa} ${idea.user.lastNameFa}` : idea.name || idea.email || 'Guest'}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusStyles[idea.status]}>{t(`ideas.status.${idea.status}`)}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Select value={idea.status} onValueChange={(v) => handleStatusChange(idea.id, v as EventIdeaStatus)}>
                        <SelectTrigger className="w-[130px] h-8 text-xs inline-flex">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">{t('ideas.status.PENDING')}</SelectItem>
                          <SelectItem value="REVIEWED">{t('ideas.status.REVIEWED')}</SelectItem>
                          <SelectItem value="PLANNED">{t('ideas.status.PLANNED')}</SelectItem>
                          <SelectItem value="REJECTED">{t('ideas.status.REJECTED')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteIdea(idea.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default withRoleGuard(AdminIdeasPage, ['ADMIN', 'EVENT_MANAGER']);
