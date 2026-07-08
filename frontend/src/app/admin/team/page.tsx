
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useTeamMembersQuery, useCreateTeamMemberMutation, useUpdateTeamMemberMutation, useDeleteTeamMemberMutation, useReorderTeamMemberMutation } from '@/hooks/use-team-queries';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { TeamMember, TeamMemberFormData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { withRoleGuard } from '@/components/admin/with-role-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, PlusCircle, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { TeamMemberFormDialog } from '@/components/admin/team-member-form-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

function AdminTeamPage() {
  const { t } = useLanguage();
  const { data: teamMembers, isLoading, error } = useTeamMembersQuery({ isAdmin: true });
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  const { mutate: createMember, isPending: isCreating } = useCreateTeamMemberMutation({
    onSuccess: () => {
      toast({ title: t('admin.team.create.successTitle') });
      setIsFormOpen(false);
    },
    onError: (e) => toast({ variant: 'destructive', title: t('errors.genericTitle'), description: e.message }),
  });

  const { mutate: updateMember, isPending: isUpdating } = useUpdateTeamMemberMutation({
    onSuccess: () => {
      toast({ title: t('admin.team.edit.successTitle') });
      setIsFormOpen(false);
    },
    onError: (e) => toast({ variant: 'destructive', title: t('errors.genericTitle'), description: e.message }),
  });

  const { mutate: deleteMember, isPending: isDeleting } = useDeleteTeamMemberMutation({
    onSuccess: () => {
      toast({ title: t('admin.team.delete.successTitle') });
      setIsDeleteAlertOpen(false);
    },
    onError: (e) => toast({ variant: 'destructive', title: t('errors.genericTitle'), description: e.message }),
  });
  const { mutate: reorderMember, isPending: isReordering } = useReorderTeamMemberMutation({
    onError: (e) => toast({ variant: 'destructive', title: t('errors.genericTitle'), description: e.message }),
  });

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingMember(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: TeamMemberFormData) => {
    if (editingMember) {
      updateMember({ id: editingMember.id, data });
    } else {
      createMember(data);
    }
  };

  const openDeleteDialog = (member: TeamMember) => {
    setMemberToDelete(member);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (memberToDelete) {
      deleteMember(memberToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center"><Skeleton className="h-10 w-48" /><Skeleton className="h-10 w-32" /></div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">{t('errors.genericTitle')}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.team.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('admin.team.subtitle')}</p>
        </div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('admin.team.addNew')}
        </Button>
      </div>

      <Card>
        <CardHeader></CardHeader>
        <CardContent>
          {teamMembers && teamMembers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.team.table.photo')}</TableHead>
                  <TableHead>{t('admin.team.table.name')}</TableHead>
                  <TableHead>{t('admin.team.table.role')}</TableHead>
                  <TableHead className="text-right">{t('admin.discounts.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...teamMembers].sort((a, b) => a.order - b.order).map((member, index) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Avatar>
                        <AvatarImage src={member.photoUrl} alt={member.name} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => reorderMember({ memberId: member.id, direction: 'up' })} disabled={isReordering || index === 0}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => reorderMember({ memberId: member.id, direction: 'down' })} disabled={isReordering || index === teamMembers.length - 1}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(member)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteDialog(member)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>{t('home.team.noMembers')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <TeamMemberFormDialog 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        member={editingMember}
        onSubmit={handleFormSubmit}
        isSubmitting={isCreating || isUpdating}
      />

       <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.team.delete.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('admin.team.delete.confirmText', { name: memberToDelete?.name })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.resources.form.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default withRoleGuard(AdminTeamPage, ['ADMIN']);
