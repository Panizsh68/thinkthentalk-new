
'use client';
import React from 'react';
import { useAdminAuth } from '@/lib/auth/admin-auth-provider';
import type { AdminRole } from '@/lib/types';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-provider';

export function withRoleGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: AdminRole[]
) {
  const GuardedComponent = (props: P) => {
    const { role, isLoading } = useAdminAuth();
    const { t } = useLanguage();

    if (isLoading) {
      return (
        <div className="flex h-64 w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    const hasAccess = role && allowedRoles.includes(role);

    if (!hasAccess) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-destructive p-12 text-center text-destructive">
          <ShieldAlert className="h-12 w-12" />
          <h2 className="text-xl font-bold">{t('errors.accessDenied')}</h2>
          <p className="max-w-sm text-muted-foreground">{t('errors.accessDeniedDescription')}</p>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
  
  GuardedComponent.displayName = `withRoleGuard(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return GuardedComponent;
}
