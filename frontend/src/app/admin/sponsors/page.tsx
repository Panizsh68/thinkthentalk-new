
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useSponsorsQuery, useCreateSponsorMutation, useUpdateSponsorMutation, useDeleteSponsorMutation } from '@/hooks/use-sponsor-queries';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { Sponsor, SponsorFormData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { withRoleGuard } from '@/components/admin/with-role-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, PlusCircle, Edit, Trash2, Globe } from 'lucide-react';
import { SponsorFormDialog } from '@/components/admin/sponsor-form-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function AdminSponsorsPage() {
  const { t } = useLanguage();
  const { data: sponsors, isLoading, error } = useSponsorsQuery({ isAdmin: true });
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [sponsorToDelete, setSponsorToDelete] = useState<Sponsor | null>(null);

  const { mutate: createSponsor, isPending: isCreating } = useCreateSponsorMutation({
    onSuccess: () => {
      toast({ title: t('admin.sponsors.create.successTitle') });
      setIsFormOpen(false);
    },
    onError: (e) => toast({ variant: 'destructive', title: t('errors.genericTitle'), description: e.message }),
  });

  const { mutate: updateSponsor, isPending: isUpdating } = useUpdateSponsorMutation({
    onSuccess: () => {
      toast({ title: t('admin.sponsors.edit.successTitle') });
      setIsFormOpen(false);
    },
    onError: (e) => toast({ variant: 'destructive', title: t('errors.genericTitle'), description: e.message }),
  });

  const { mutate: deleteSponsor, isPending: isDeleting } = useDeleteSponsorMutation({
     onSuccess: () => {
      toast({ title: t('admin.sponsors.delete.successTitle') });
      setIsDeleteAlertOpen(false);
    },
    onError: (e) => toast({ variant: 'destructive', title: t('errors.genericTitle'), description: e.message }),
  });

  const handleEdit = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingSponsor(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: SponsorFormData) => {
    if (editingSponsor) {
      updateSponsor({ id: editingSponsor.id, data });
    } else {
      createSponsor(data);
    }
  };

  const openDeleteDialog = (sponsor: Sponsor) => {
    setSponsorToDelete(sponsor);
    setIsDeleteAlertOpen(true);
  }

  const handleDeleteConfirm = () => {
    if (sponsorToDelete) {
      deleteSponsor(sponsorToDelete.id);
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
          <h1 className="text-2xl font-bold">{t('admin.sponsors.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('admin.sponsors.subtitle')}</p>
        </div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('admin.sponsors.addNew')}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {sponsors && sponsors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.sponsors.table.logo')}</TableHead>
                  <TableHead>{t('admin.sponsors.table.name')}</TableHead>
                  <TableHead>{t('admin.sponsors.table.tagline')}</TableHead>
                  <TableHead>{t('admin.sponsors.table.website')}</TableHead>
                  <TableHead className="text-right">{t('admin.discounts.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sponsors.map((sponsor) => (
                  <TableRow key={sponsor.id}>
                    <TableCell>
                      <Image src={sponsor.logoUrl} alt={sponsor.name} width={40} height={40} className="rounded-md object-contain" />
                    </TableCell>
                    <TableCell className="font-medium">{sponsor.name}</TableCell>
                    <TableCell>{sponsor.productOrTagline}</TableCell>
                    <TableCell>
                      {sponsor.websiteUrl ? (
                        <a href={sponsor.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          <span>{t('admin.sponsors.actions.visit')}</span>
                        </a>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(sponsor)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteDialog(sponsor)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>{t('home.sponsors.noSponsors')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <SponsorFormDialog 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        sponsor={editingSponsor}
        onSubmit={handleFormSubmit}
        isSubmitting={isCreating || isUpdating}
      />

       <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.sponsors.delete.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('admin.sponsors.delete.confirmText', { name: sponsorToDelete?.name })}</AlertDialogDescription>
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

export default withRoleGuard(AdminSponsorsPage, ['ADMIN']);
