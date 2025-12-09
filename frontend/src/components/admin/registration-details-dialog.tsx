
'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { UserRegistrationDetails } from '@/lib/types';
import { Separator } from '../ui/separator';

interface RegistrationDetailsDialogProps {
  registration: UserRegistrationDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DetailRow = ({ label, value }: { label: string; value?: string | number | null; }) => {
    if (!value) return null;
    return (
        <div className="flex justify-between py-2 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium text-right">{value}</dd>
        </div>
    )
}


export function RegistrationDetailsDialog({ registration, open, onOpenChange }: RegistrationDetailsDialogProps) {
  const { t } = useLanguage();
  const user = registration.user;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('admin.registrations.details.title')}</DialogTitle>
          <DialogDescription>{t('admin.registrations.details.subtitle', { userName: `${user.firstNameFa} ${user.lastNameFa}`})}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
            
            <section>
                <h3 className="font-semibold mb-2">{t('registration.steps.personal')}</h3>
                <dl className="divide-y divide-border border rounded-lg p-4">
                    <DetailRow label={t('registration.fields.firstNameFa')} value={user.firstNameFa} />
                    <DetailRow label={t('registration.fields.lastNameFa')} value={user.lastNameFa} />
                    <DetailRow label={t('registration.fields.firstNameEn')} value={user.firstNameEn} />
                    <DetailRow label={t('registration.fields.lastNameEn')} value={user.lastNameEn} />
                    <DetailRow label={t('auth.mobileLabel')} value={user.mobile} />
                    <DetailRow label={t('registration.fields.email')} value={user.email} />
                    <DetailRow label={t('registration.fields.age')} value={user.age} />
                    <DetailRow label={t('registration.fields.gender')} value={user.gender ? t(`registration.fields.gender${user.gender.charAt(0)}${user.gender.slice(1).toLowerCase()}`) : null} />
                </dl>
            </section>
            
            <Separator />

             <section>
                <h3 className="font-semibold mb-2">{t('admin.registrations.details.paymentTitle')}</h3>
                 <dl className="divide-y divide-border border rounded-lg p-4">
                    <DetailRow label={t('payment.paymentId')} value={registration.paymentId} />
                    <DetailRow label={t('admin.registrations.table.status')} value={t(`registration.status.${registration.status.toLowerCase()}`)} />
                    <DetailRow label={t('registration.summary.price')} value={`${registration.payment.amount} ${registration.payment.currency}`} />
                    <DetailRow label={t('admin.registrations.details.gatewayId')} value={registration.payment.gatewayTransactionId} />
                </dl>
            </section>

        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t('admin.registrations.details.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
