'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useAdminUserQuery } from '@/hooks/use-admin-users-queries';
import { useLanguage } from '@/lib/i18n/language-provider';
import { getFormattedDateTime } from '@/lib/event-helpers';

const missingFieldLabels: Record<string, string> = {
  firstNameFa: 'registration.fields.firstNameFa',
  lastNameFa: 'registration.fields.lastNameFa',
  educationLevel: 'registration.fields.educationLevel',
  languageLevel: 'registration.fields.languageLevel',
  age: 'registration.fields.age',
  gender: 'registration.fields.gender',
  isEmployed: 'registration.fields.isEmployed',
  jobTitle: 'registration.fields.jobTitle',
};

const DetailRow = ({ label, value }: { label: string; value?: string | number | null }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
};

export default function AdminUserDetailsPage() {
  const params = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { data, isLoading, error } = useAdminUserQuery(params.id);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-destructive text-center">{t('errors.fetchRegistrations')}</p>;
  }

  const profile = data.profile;
  const latestForm = data.registrations[0]?.formData;
  const employedValue = latestForm?.isEmployed ?? profile.isEmployed;
  const fullName =
    `${profile.firstNameFa ?? ''} ${profile.lastNameFa ?? ''}`.trim() ||
    `${profile.firstNameEn ?? ''} ${profile.lastNameEn ?? ''}`.trim() ||
    profile.mobile;

  const registrationStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      PAID: 'bg-green-600',
      PENDING: 'bg-amber-500',
      FAILED: 'bg-red-600',
      CANCELLED: 'bg-slate-500',
    };
    const cls = variants[status] ?? 'bg-slate-600';
    const key = typeof status === 'string' ? status.toLowerCase() : status;
    return <Badge className={`${cls} text-white`}>{t(`registration.status.${key}`)}</Badge>;
  };

  const paymentStatusBadge = (status?: string | null) => {
    if (!status) return null;
    const variants: Record<string, string> = {
      SUCCESS: 'bg-green-600',
      PENDING: 'bg-amber-500',
      FAILED: 'bg-red-600',
    };
    const cls = variants[status] ?? 'bg-slate-600';
    return <Badge className={`${cls} text-white`}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span>{t('admin.users.title')}</span>
          </div>
          <h1 className="text-2xl font-bold">{fullName}</h1>
          <p className="text-muted-foreground">{profile.mobile}</p>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('actions.back')}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t('admin.users.profileCard.title')}</CardTitle>
            <CardDescription>{t('admin.users.profileCard.completion')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge
              className={profile.profileCompleted ? 'bg-green-600 text-white' : 'bg-amber-500 text-white'}
            >
              {profile.profileCompleted
                ? t('admin.users.badges.complete')
                : t('admin.users.badges.incomplete')}
            </Badge>
            {profile.missingFields?.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t('admin.users.profileCard.missingFields')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.missingFields.map((field) => (
                    <Badge key={field} variant="outline" className="border-amber-500 text-amber-700">
                      {t(missingFieldLabels[field] ?? field)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <Separator />
            <DetailRow label={t('registration.fields.email')} value={profile.email} />
            <DetailRow label={t('registration.fields.languageLevel')} value={profile.languageLevel} />
            <DetailRow label={t('registration.fields.educationLevel')} value={profile.educationLevel} />
            <DetailRow label={t('registration.fields.fieldOfStudy')} value={profile.fieldOfStudy} />
            <DetailRow label={t('registration.fields.age')} value={profile.age} />
            <DetailRow label={t('registration.fields.gender')} value={profile.gender} />
            <DetailRow
              label={t('registration.fields.isEmployed')}
              value={
                profile.isEmployed === undefined || profile.isEmployed === null
                  ? ''
                  : profile.isEmployed
                    ? t('actions.yes')
                    : t('actions.no')
              }
            />
            {profile.isEmployed && (
              <DetailRow label={t('registration.fields.jobTitle')} value={profile.jobTitle} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('admin.users.latestFormData')}</CardTitle>
            <CardDescription>{t('admin.users.profileCard.title')}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <DetailRow label={t('registration.fields.firstNameFa')} value={latestForm?.firstNameFa ?? profile.firstNameFa} />
              <DetailRow label={t('registration.fields.lastNameFa')} value={latestForm?.lastNameFa ?? profile.lastNameFa} />
              <DetailRow label={t('registration.fields.firstNameEn')} value={latestForm?.firstNameEn ?? profile.firstNameEn} />
              <DetailRow label={t('registration.fields.lastNameEn')} value={latestForm?.lastNameEn ?? profile.lastNameEn} />
              <DetailRow label={t('registration.fields.age')} value={latestForm?.age ?? profile.age} />
              <DetailRow label={t('registration.fields.gender')} value={latestForm?.gender ?? profile.gender} />
              <DetailRow label={t('registration.fields.email')} value={latestForm?.email ?? profile.email} />
              <DetailRow label={t('auth.mobileLabel')} value={latestForm?.mobile ?? profile.mobile} />
            </div>
            <div className="space-y-1">
              <DetailRow label={t('registration.fields.educationLevel')} value={latestForm?.educationLevel ?? profile.educationLevel} />
              <DetailRow label={t('registration.fields.fieldOfStudy')} value={latestForm?.fieldOfStudy ?? profile.fieldOfStudy} />
              <DetailRow
                label={t('registration.fields.isEmployed')}
                value={
                  employedValue === undefined || employedValue === null
                    ? ''
                    : employedValue
                      ? t('actions.yes')
                      : t('actions.no')
                }
              />
              {employedValue && (
                <DetailRow label={t('registration.fields.jobTitle')} value={latestForm?.jobTitle ?? profile.jobTitle} />
              )}
              <DetailRow label={t('registration.fields.languageLevel')} value={latestForm?.languageLevel ?? profile.languageLevel} />
              <DetailRow label={t('registration.fields.referralSource')} value={latestForm?.referralSource} />
              <DetailRow label={t('registration.fields.referrerName')} value={latestForm?.referrerName} />
              <DetailRow label={t('registration.fields.otherReferralSource')} value={latestForm?.otherReferralSource} />
              <DetailRow
                label={t('registration.fields.acceptRules')}
                value={
                  latestForm?.acceptedRules !== undefined
                    ? latestForm.acceptedRules
                      ? t('actions.yes')
                      : t('actions.no')
                    : ''
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('admin.users.registrations.title')}</CardTitle>
            <CardDescription>{t('admin.users.subtitle')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {data.registrations.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('admin.users.registrations.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.registrations.table.event')}</TableHead>
                    <TableHead>{t('admin.registrations.table.ticket')}</TableHead>
                    <TableHead>{t('admin.registrations.table.status')}</TableHead>
                    <TableHead>{t('payment.paymentId')}</TableHead>
                    <TableHead>{t('admin.registrations.table.date')}</TableHead>
                    <TableHead className="text-right">{t('admin.users.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.registrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <div className="font-semibold">{reg.eventTitle}</div>
                        <div className="text-xs text-muted-foreground">
                          {reg.eventStartDateTime
                            ? getFormattedDateTime(reg.eventStartDateTime, language, 'card')
                            : ''}
                        </div>
                      </TableCell>
                      <TableCell>{t(`tickets.${reg.ticketType.toLowerCase()}`)}</TableCell>
                      <TableCell className="space-y-1">
                        {registrationStatusBadge(reg.status)}
                        {paymentStatusBadge(reg.paymentStatus)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {reg.paymentId ?? '—'}
                      </TableCell>
                      <TableCell>
                        {getFormattedDateTime(reg.createdAt, language, 'card')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/registrations/${reg.id}`}>
                            {t('admin.users.registrations.open')}
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
