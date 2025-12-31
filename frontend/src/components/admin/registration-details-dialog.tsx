
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
    if (value === undefined || value === null || value === '') return null;
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
  const payment = registration.payment;
  const formData = registration.formData as any;

  const isPlaceholder = (value?: string | null) => {
    if (!value) return true;
    const normalized = value.trim().toLowerCase();
    return ['نام', 'نام خانوادگی', 'name', 'first name', 'last name'].includes(normalized);
  };

  const displayName = (() => {
    const pairs = [
      { first: formData?.firstNameFa, last: formData?.lastNameFa },
      { first: user.firstNameFa, last: user.lastNameFa },
      { first: formData?.firstNameEn, last: formData?.lastNameEn },
      { first: user.firstNameEn, last: user.lastNameEn },
    ];
    for (const p of pairs) {
      if ((!isPlaceholder(p.first) && p.first) || (!isPlaceholder(p.last) && p.last)) {
        return `${p.first ?? ''} ${p.last ?? ''}`.trim();
      }
    }
    return user.mobile;
  })();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('admin.registrations.details.title')}</DialogTitle>
          <DialogDescription>{t('admin.registrations.details.subtitle', { userName: displayName })}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-4">
            <section>
                <h3 className="font-semibold mb-2">{t('registration.steps.personal')}</h3>
                <dl className="divide-y divide-border border rounded-lg p-4">
                    <DetailRow label={t('registration.fields.firstNameFa')} value={formData?.firstNameFa ?? user.firstNameFa} />
                    <DetailRow label={t('registration.fields.lastNameFa')} value={formData?.lastNameFa ?? user.lastNameFa} />
                    <DetailRow label={t('registration.fields.firstNameEn')} value={formData?.firstNameEn ?? user.firstNameEn} />
                    <DetailRow label={t('registration.fields.lastNameEn')} value={formData?.lastNameEn ?? user.lastNameEn} />
                    <DetailRow label={t('registration.fields.age')} value={formData?.age ?? user.age} />
                    <DetailRow
                      label={t('registration.fields.gender')}
                      value={
                        formData?.gender ?? user.gender
                          ? t(
                              `registration.fields.gender${(formData?.gender ?? user.gender).toString().charAt(0)}${(formData?.gender ?? user.gender).toString().slice(1).toLowerCase()}`,
                            )
                          : ''
                      }
                    />
                </dl>
            </section>

            <section>
                <h3 className="font-semibold mb-2">{t('registration.steps.contact')}</h3>
                <dl className="divide-y divide-border border rounded-lg p-4">
                    <DetailRow label={t('auth.mobileLabel')} value={formData?.mobile ?? user.mobile} />
                    <DetailRow label={t('registration.fields.email')} value={formData?.email ?? user.email} />
                </dl>
            </section>
            
            <section>
                <h3 className="font-semibold mb-2">{t('registration.steps.education')}</h3>
                <dl className="divide-y divide-border border rounded-lg p-4">
                    <DetailRow label={t('registration.fields.educationLevel')} value={formData?.educationLevel ?? user.educationLevel} />
                    <DetailRow label={t('registration.fields.fieldOfStudy')} value={formData?.fieldOfStudy ?? user.fieldOfStudy} />
                    <DetailRow label={t('registration.fields.isEmployed')} value={(formData?.isEmployed ?? user.isEmployed) ? t('actions.yes') : t('actions.no')} />
                    {(formData?.isEmployed ?? user.isEmployed) && (
                        <DetailRow label={t('registration.fields.jobTitle')} value={formData?.jobTitle ?? user.jobTitle} />
                    )}
                </dl>
            </section>

            <section>
                <h3 className="font-semibold mb-2">{t('registration.steps.language')}</h3>
                <dl className="divide-y divide-border border rounded-lg p-4">
                    <DetailRow label={t('registration.fields.languageLevel')} value={formData?.languageLevel ?? user.languageLevel} />
                    <DetailRow label={t('registration.fields.referralSource')} value={formData?.referralSource} />
                    <DetailRow label={t('registration.fields.referrerName')} value={formData?.referrerName} />
                    <DetailRow label={t('registration.fields.otherReferralSource')} value={formData?.otherReferralSource} />
                </dl>
            </section>

            <Separator />

             <section>
                <h3 className="font-semibold mb-2">{t('admin.registrations.details.paymentTitle')}</h3>
                 <dl className="divide-y divide-border border rounded-lg p-4">
                    <DetailRow label={t('payment.paymentId')} value={registration.paymentId} />
                    <DetailRow label={t('admin.registrations.table.status')} value={t(`registration.status.${registration.status.toLowerCase()}`)} />
                    <DetailRow
                      label={t('registration.summary.price')}
                      value={payment ? `${payment.amount} ${payment.currency}` : null}
                    />
                    <DetailRow
                      label={t('admin.registrations.details.gatewayId')}
                      value={payment?.gatewayTransactionId}
                    />
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
