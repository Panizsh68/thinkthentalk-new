'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminUsersQuery } from '@/hooks/use-admin-users-queries';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { AdminUserListItem } from '@/lib/types';
import { getFormattedDateTime } from '@/lib/event-helpers';
import { ArrowRight, Loader2, Search, Users } from 'lucide-react';

const isPlaceholder = (value?: string | null) => {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return ['نام', 'نام خانوادگی', 'name', 'first name', 'last name'].includes(normalized);
};

const getDisplayName = (user: AdminUserListItem) => {
  const candidates = [
    { first: user.firstNameFa, last: user.lastNameFa },
    { first: user.firstNameEn, last: user.lastNameEn },
  ];

  for (const c of candidates) {
    if ((!isPlaceholder(c.first) && c.first) || (!isPlaceholder(c.last) && c.last)) {
      return `${c.first ?? ''} ${c.last ?? ''}`.trim();
    }
  }

  return user.mobile;
};

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

const ProfileStatusBadge = ({ complete, label }: { complete: boolean; label: string }) => (
  <Badge variant={complete ? 'default' : 'secondary'} className={complete ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-100 text-amber-800'}>
    {label}
  </Badge>
);

export default function AdminUsersPage() {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [profileStatus, setProfileStatus] = useState<'all' | 'complete' | 'incomplete'>('all');

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      profileStatus: profileStatus === 'all' ? undefined : profileStatus,
    }),
    [profileStatus, search],
  );

  const { data: users, isLoading, error } = useAdminUsersQuery(filters);

  const renderMissingFields = (user: AdminUserListItem) => {
    if (!user.missingFields || user.missingFields.length === 0) {
      return <Badge variant="outline" className="border-green-500 text-green-700">{t('admin.users.badges.complete')}</Badge>;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {user.missingFields.map((field) => (
          <Badge key={field} variant="outline" className="border-amber-500 text-amber-700">
            {t(missingFieldLabels[field] ?? field)}
          </Badge>
        ))}
      </div>
    );
  };

  const profileBadgeLabel = (complete: boolean) =>
    complete ? t('admin.users.badges.complete') : t('admin.users.badges.incomplete');

  const renderTableRow = (user: AdminUserListItem) => {
    const name = getDisplayName(user);
    const lastRegistration = user.lastRegistrationAt
      ? getFormattedDateTime(user.lastRegistrationAt, language, 'card')
      : '—';

    return (
      <TableRow key={user.id}>
        <TableCell>
          <div className="font-semibold">{name}</div>
          <div className="text-sm text-muted-foreground">{user.mobile}</div>
          {user.email && <div className="text-xs text-muted-foreground">{user.email}</div>}
        </TableCell>
        <TableCell>
          <ProfileStatusBadge complete={user.profileCompleted} label={profileBadgeLabel(user.profileCompleted)} />
        </TableCell>
        <TableCell>
          <div className="font-semibold">{user.registrationCount}</div>
          <div className="text-xs text-muted-foreground">{lastRegistration}</div>
        </TableCell>
        <TableCell>{renderMissingFields(user)}</TableCell>
        <TableCell className="text-right">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/users/${user.id}`}>
              {t('actions.view')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            {t('admin.users.title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('admin.users.subtitle')}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t('admin.filters.title')}
          </CardTitle>
          <CardDescription>{t('admin.users.filters.searchPlaceholder')}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder={t('admin.users.filters.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={profileStatus}
            onValueChange={(v: 'all' | 'complete' | 'incomplete') => setProfileStatus(v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('admin.users.filters.profileStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.users.filters.all')}</SelectItem>
              <SelectItem value="complete">{t('admin.users.filters.complete')}</SelectItem>
              <SelectItem value="incomplete">{t('admin.users.filters.incomplete')}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-destructive text-center py-8">{t('errors.fetchRegistrations')}</p>
      ) : users && users.length > 0 ? (
        <>
          <div className="hidden md:block border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.users.table.user')}</TableHead>
                  <TableHead>{t('admin.users.table.profileStatus')}</TableHead>
                  <TableHead>{t('admin.users.table.registrations')}</TableHead>
                  <TableHead>{t('admin.users.table.missing')}</TableHead>
                  <TableHead className="text-right">{t('admin.users.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{users.map(renderTableRow)}</TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 md:hidden gap-4">
            {users.map((user) => {
              const name = getDisplayName(user);
              const lastRegistration = user.lastRegistrationAt
                ? getFormattedDateTime(user.lastRegistrationAt, language, 'card')
                : '—';
              return (
                <Card key={user.id}>
                  <CardHeader className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{user.mobile}</p>
                      </div>
                      <ProfileStatusBadge
                        complete={user.profileCompleted}
                        label={profileBadgeLabel(user.profileCompleted)}
                      />
                    </div>
                    <CardDescription>{user.email}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>{t('admin.users.table.registrations')}:</span>
                      <span className="font-semibold">{user.registrationCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('admin.users.table.lastRegistration')}:</span>
                      <span className="font-medium">{lastRegistration}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('admin.users.table.missing')}:</span>
                      <div className="mt-2">{renderMissingFields(user)}</div>
                    </div>
                    <Button asChild size="sm" className="w-full">
                      <Link href={`/admin/users/${user.id}`}>{t('actions.view')}</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center text-muted-foreground py-12">
          <p>{t('admin.registrations.noRegistrationsFound')}</p>
        </div>
      )}
    </div>
  );
}
