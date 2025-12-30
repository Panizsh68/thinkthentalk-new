
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { Loader2, Save, AlertTriangle, ShieldCheck, History, Edit } from 'lucide-react';
import { useRegistrationQuery, useUpdateRegistrationMutation } from '@/hooks/use-admin-registration-queries';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RegistrationEditForm, getProfileSchema } from '@/components/admin/registration-edit-form';
import type { RegistrationFormData } from '@/hooks/use-registration-wizard-store';
import { useParams } from 'next/navigation';
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
import { getFormattedPrice } from '@/lib/event-helpers';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ProfileFormValues = z.infer<ReturnType<typeof getProfileSchema>>;

export default function RegistrationDetailPage() {
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const { data: registration, isLoading, error } = useRegistrationQuery(params.id);
  const { mutate: updateRegistration, isPending: isUpdating } = useUpdateRegistrationMutation();
  const [isConfirmingStatus, setIsConfirmingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<"PAID" | "PENDING" | "FAILED" | "CANCELLED" | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(getProfileSchema(t)),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (registration) {
      form.reset(registration.formData);
    }
  }, [registration, form]);

  const onSubmit = (values: ProfileFormValues) => {
    if (!registration) return;

    updateRegistration({
      registrationId: registration.id,
      updates: { formData: values },
    }, {
      onSuccess: () => toast({ title: t('profile.updateSuccessTitle') }),
      onError: (e) => toast({ variant: 'destructive', title: t('errors.genericTitle'), description: e.message }),
    });
  };

  const handleStatusChange = (status: "PAID" | "PENDING" | "FAILED" | "CANCELLED") => {
    setNewStatus(status);
    setIsConfirmingStatus(true);
  }

  const confirmStatusChange = () => {
    if (!registration || !newStatus) return;
    updateRegistration({
      registrationId: registration.id,
      updates: { status: newStatus }
    }, {
      onSuccess: (data) => toast({ title: "Status Updated", description: `Registration status changed to ${data.status}` }),
      onError: (e) => toast({ variant: 'destructive', title: t('errors.genericTitle'), description: e.message }),
      onSettled: () => {
        setIsConfirmingStatus(false);
        setNewStatus(null);
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !registration) {
    return <p className="text-destructive">{t('errors.fetchRegistrations')}</p>
  }

  const mockAuditLog = [
    { field: 'status', oldValue: 'PENDING', newValue: 'PAID', user: 'admin@thinkthentalk.com', date: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { field: 'firstNameFa', oldValue: 'کاربر', newValue: 'کاربر تستی', user: 'admin@thinkthentalk.com', date: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  ];

  const payment = registration.payment;
  const paymentAmount = payment ? getFormattedPrice(payment.amount, payment.currency, t) : '—';
  const gatewayId = payment?.gatewayTransactionId || 'N/A';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('admin.registrations.details.editUserTitle')}</CardTitle>
              <CardDescription>{t('admin.registrations.details.editUserSubtitle')}</CardDescription>
            </div>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {t('profile.saveButton')}
            </Button>
          </CardHeader>
          <CardContent>
            <RegistrationEditForm form={form} />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              {t('admin.registrations.details.paymentTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{t('admin.registrations.table.status')}</span>
              <span className="font-bold">{t(`registration.status.${registration.status.toLowerCase()}`)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{t('registration.summary.price')}</span>
              <span className="font-bold">{paymentAmount}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{t('admin.registrations.details.gatewayId')}</span>
              <span className="font-mono text-xs">{gatewayId}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Select onValueChange={(v: any) => handleStatusChange(v)} disabled={isUpdating}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.registrations.details.changeStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PAID">{t('registration.status.paid')}</SelectItem>
                <SelectItem value="PENDING">{t('registration.status.pending')}</SelectItem>
                <SelectItem value="FAILED">{t('registration.status.failed')}</SelectItem>
                <SelectItem value="CANCELLED">{t('registration.status.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              {t('admin.registrations.details.auditLogTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-60 overflow-y-auto">
            {mockAuditLog.map((log, index) => (
              <div key={index} className="text-xs">
                <p className="font-medium">Changed <span className="font-bold">{log.field}</span> from <span className="text-destructive">{log.oldValue}</span> to <span className="text-green-600">{log.newValue}</span></p>
                <p className="text-muted-foreground">{log.user} on {format(log.date, 'PPp')}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isConfirmingStatus} onOpenChange={setIsConfirmingStatus}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.registrations.details.confirmStatusChangeTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.registrations.details.confirmStatusChangeDescription', { newStatus: newStatus || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNewStatus(null)}>{t('admin.resources.form.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange} disabled={isUpdating}>{t('actions.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
