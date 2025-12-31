
'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

import { useDiscountsQuery, useUpdateDiscountMutation, useDeleteDiscountMutation } from '@/hooks/use-discount-queries';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { Discount } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Edit, MoreHorizontal, Filter, X, Trash2, Power, PowerOff } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { withRoleGuard } from '@/components/admin/with-role-guard';
import { cn } from '@/lib/utils';


type DiscountFilters = {
  status: 'all' | 'active' | 'inactive';
  type: 'all' | 'PERCENT' | 'FIXED';
};

function AdminDiscountsPage() {
  const { t, language } = useLanguage();
  const { data: discounts, isLoading, error } = useDiscountsQuery();
  const [filters, setFilters] = useState<DiscountFilters>({ status: 'all', type: 'all' });

  const filteredDiscounts = useMemo(() => {
    if (!discounts) return [];
    return discounts.filter(discount => {
      const statusMatch =
        filters.status === 'all' ||
        (filters.status === 'active' && discount.isActive) ||
        (filters.status === 'inactive' && !discount.isActive);
      const typeMatch = filters.type === 'all' || filters.type === discount.type;
      return statusMatch && typeMatch;
    });
  }, [discounts, filters]);


  const handleFilterChange = (key: keyof DiscountFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: 'all', type: 'all' });
  };
  
  if (isLoading) return <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full" />
  </div>

  if (error) return <p className="text-destructive">{t('errors.genericTitle')}</p>

  const isRTL = language === 'fa';

  return (
    <div className="space-y-6">
      <div className={cn("flex items-center justify-between", isRTL && "text-right")}>
        <div>
          <h1 className="text-2xl font-bold">{t('admin.discounts.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('admin.discounts.subtitle')}</p>
        </div>
        <Button asChild>
          <Link href="/admin/discounts/new">
            <PlusCircle className={cn(isRTL ? "ml-2" : "mr-2", "h-4 w-4")} />
            {t('admin.discounts.createNew')}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">{t('admin.filters.title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
            <SelectTrigger>
              <SelectValue placeholder={t('admin.discounts.filters.statusPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.filters.status.all')}</SelectItem>
              <SelectItem value="active">{t('admin.discounts.filters.active')}</SelectItem>
              <SelectItem value="inactive">{t('admin.discounts.filters.inactive')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.type} onValueChange={(v) => handleFilterChange('type', v)}>
            <SelectTrigger>
              <SelectValue placeholder={t('admin.discounts.filters.typePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.filters.all')}</SelectItem>
              <SelectItem value="PERCENT">{t('admin.discounts.types.percent')}</SelectItem>
              <SelectItem value="FIXED">{t('admin.discounts.types.fixed')}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
        <CardFooter className={cn(isRTL && "justify-end")}>
          <Button variant="ghost" onClick={clearFilters} disabled={filters.status === 'all' && filters.type === 'all'}>
            <X className={cn(isRTL ? "ml-2" : "mr-2", "h-4 w-4")} />
            {t('actions.clearFilters')}
          </Button>
        </CardFooter>
      </Card>

      {/* Discounts Display */}
       <div className="hidden md:block border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={cn(isRTL && "text-right")}>{t('admin.discounts.table.name')}</TableHead>
                  <TableHead className={cn(isRTL && "text-right")}>{t('admin.discounts.table.type')}</TableHead>
                  <TableHead className={cn(isRTL && "text-right")}>{t('admin.discounts.table.value')}</TableHead>
                  <TableHead className={cn(isRTL && "text-right")}>{t('admin.discounts.table.events')}</TableHead>
                  <TableHead className={cn(isRTL && "text-right")}>{t('admin.discounts.table.validity')}</TableHead>
                   <TableHead className={cn(isRTL && "text-right")}>{t('admin.discounts.table.usage')}</TableHead>
                  <TableHead className={cn(isRTL && "text-right")}>{t('admin.discounts.table.status')}</TableHead>
                  <TableHead className={cn("text-right", isRTL && "text-left")}>{t('admin.discounts.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDiscounts?.map(discount => <DiscountTableRow key={discount.id} discount={discount} t={t} language={language} />)}
              </TableBody>
            </Table>
       </div>
       <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredDiscounts?.map(discount => <DiscountCard key={discount.id} discount={discount} t={t} language={language}/>)}
       </div>

        {!isLoading && !error && filteredDiscounts?.length === 0 && (
            <div className="text-center text-muted-foreground py-8 space-y-4">
                <p>{t('admin.discounts.noDiscountsFound')}</p>
                <Button variant="outline" onClick={clearFilters}>{t('actions.clearFilters')}</Button>
            </div>
        )}
    </div>
  );
}

export default withRoleGuard(AdminDiscountsPage, ['ADMIN', 'FINANCE']);


function DiscountTableRow({ discount, t, language }: { discount: Discount, t: (k:string, opts?: any) => string, language: 'en' | 'fa' }) {
    const isRTL = language === 'fa';
    return (
        <TableRow>
            <TableCell className={cn("font-medium", isRTL && "text-right")}>
                <div>{discount.name}</div>
                {discount.code && <div className="text-xs text-muted-foreground font-mono">{discount.code}</div>}
            </TableCell>
            <TableCell className={cn(isRTL && "text-right")}>
                <Badge variant="outline">{t(`admin.discounts.types.${discount.type.toLowerCase()}`)}</Badge>
            </TableCell>
            <TableCell className={cn(isRTL && "text-right")}>
                {discount.type === 'PERCENT' ? `${discount.value}%` : `${discount.value.toLocaleString()} ${t('admin.currency.TOMAN')}`}
            </TableCell>
             <TableCell className={cn(isRTL && "text-right")}>
                {discount.applicableEventIds && discount.applicableEventIds.length > 0 ? t('admin.discounts.table.specificEvents', { count: discount.applicableEventIds.length }) : t('admin.discounts.table.allEvents')}
             </TableCell>
             <TableCell className={cn("text-xs", isRTL && "text-right")}>
                <div>{t('admin.discounts.table.start')}: {format(new Date(discount.startDate), 'PP')}</div>
                <div>{t('admin.discounts.table.end')}: {format(new Date(discount.endDate), 'PP')}</div>
             </TableCell>
             <TableCell className={cn(isRTL && "text-right")}>
                {discount.usedCount} / {discount.maxUses ?? '∞'}
             </TableCell>
             <TableCell className={cn(isRTL && "text-right")}>
                 <Badge variant={discount.isActive ? 'default' : 'secondary'}>
                    {discount.isActive ? t('admin.discounts.status.active') : t('admin.discounts.status.inactive')}
                </Badge>
             </TableCell>
             <TableCell className={cn("text-right", isRTL && "text-left")}>
                <ActionsMenu discount={discount} t={t} language={language} />
             </TableCell>
        </TableRow>
    )
}

function DiscountCard({ discount, t, language }: { discount: Discount, t: (k:string, opts?: any) => string, language: 'en' | 'fa' }) {
    const isRTL = language === 'fa';
    return (
        <Card dir={isRTL ? 'rtl' : 'ltr'}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{discount.name}</CardTitle>
                        {discount.code && <CardDescription className="font-mono">{discount.code}</CardDescription>}
                    </div>
                    <ActionsMenu discount={discount} t={t} language={language} />
                </div>
                 <Badge variant={discount.isActive ? 'default' : 'secondary'} className="w-fit">
                    {discount.isActive ? t('admin.discounts.status.active') : t('admin.discounts.status.inactive')}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('admin.discounts.table.type')}</span>
                    <span className="font-medium">{t(`admin.discounts.types.${discount.type.toLowerCase()}`)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('admin.discounts.table.value')}</span>
                    <span className="font-medium">{discount.type === 'PERCENT' ? `${discount.value}%` : `${discount.value.toLocaleString()} ${t('admin.currency.TOMAN')}`}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('admin.discounts.table.usage')}</span>
                    <span className="font-medium">{discount.usedCount} / {discount.maxUses ?? '∞'}</span>
                </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
                <p>{t('admin.discounts.table.validRange', { startDate: format(new Date(discount.startDate), 'PP'), endDate: format(new Date(discount.endDate), 'PP') })}</p>
            </CardFooter>
        </Card>
    )
}


function ActionsMenu({ discount, t, language }: { discount: Discount; t: (k:string, opts?: any) => string; language: 'en' | 'fa' }) {
    const { toast } = useToast();
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const { mutate: updateDiscount, isPending: isUpdating } = useUpdateDiscountMutation();
    const { mutate: deleteDiscount, isPending: isDeleting } = useDeleteDiscountMutation();
    const isRTL = language === 'fa';
    
    const handleToggleActive = () => {
        updateDiscount({ id: discount.id, data: { isActive: !discount.isActive } }, {
            onSuccess: () => {
                toast({ title: t('admin.discounts.statusUpdateSuccess'), description: t('admin.discounts.statusUpdateSuccessDesc', { status: t(!discount.isActive ? 'admin.discounts.status.active' : 'admin.discounts.status.inactive') }) });
            },
            onError: (error) => {
                toast({ variant: 'destructive', title: t('errors.genericTitle'), description: error.message });
            }
        })
    }

    const handleDelete = () => {
        deleteDiscount(discount.id, {
            onSuccess: () => {
                 toast({ title: t('admin.discounts.deleteSuccess') });
                 setIsDeleteAlertOpen(false);
            },
            onError: (error) => {
                 toast({ variant: 'destructive', title: t('errors.genericTitle'), description: error.message });
            }
        });
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">{t('admin.discounts.table.actions')}</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? "start" : "end"}>
                    <DropdownMenuItem asChild>
                        <Link href={`/admin/discounts/${discount.id}/edit`}>
                            <Edit className={cn(isRTL ? "ml-2" : "mr-2", "h-4 w-4")} />
                            <span>{t('actions.edit')}</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleToggleActive} disabled={isUpdating}>
                        {discount.isActive ? <PowerOff className={cn(isRTL ? "ml-2" : "mr-2", "h-4 w-4")} /> : <Power className={cn(isRTL ? "ml-2" : "mr-2", "h-4 w-4")} />}
                        <span>{discount.isActive ? t('actions.deactivate') : t('actions.activate')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onSelect={() => setIsDeleteAlertOpen(true)}>
                        <Trash2 className={cn(isRTL ? "ml-2" : "mr-2", "h-4 w-4")} />
                        <span>{t('actions.delete')}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
                    <AlertDialogHeader className={cn(isRTL && "text-right")}>
                    <AlertDialogTitle>{t('admin.discounts.delete.confirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('admin.discounts.deleteConfirmText', { discountName: discount.name })}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className={cn(isRTL && "flex-row-reverse")}>
                    <AlertDialogCancel>{t('admin.resources.form.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('actions.delete')}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
