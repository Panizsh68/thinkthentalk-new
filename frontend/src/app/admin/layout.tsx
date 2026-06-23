'use client';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Briefcase, Calendar, Home, Receipt, Tag, Users, ShieldCheck, MessageCircle, User, Building, Users2, Mail, UserCheck, Handshake, Lightbulb } from 'lucide-react';
import { AdminAuthProvider, useAdminAuth } from '@/lib/auth/admin-auth-provider';
import { useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { hasPermission, type PagePermission } from '@/lib/auth/permissions';
import { useLanguage } from '@/lib/i18n/language-provider';

function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const { currentAdmin, isAdminAuthenticated, isLoading, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t, language } = useLanguage();

  const isLoginPage = pathname === '/admin/login';

  const allAdminNavItems = useMemo(() => [
    { href: '/admin', labelKey: 'admin.nav.dashboard', icon: ShieldCheck, permission: 'dashboard' },
    { href: '/admin/events', labelKey: 'admin.nav.events', icon: Calendar, permission: 'events' },
    { href: '/admin/registrations', labelKey: 'admin.nav.registrations', icon: Users, permission: 'registrations' },
    { href: '/admin/users', labelKey: 'admin.nav.users', icon: UserCheck, permission: 'users' },
    { href: '/admin/payments', labelKey: 'admin.nav.payments', icon: Receipt, permission: 'payments' },
    { href: '/admin/discounts', labelKey: 'admin.nav.discounts', icon: Tag, permission: 'discounts' },
    { href: '/admin/messaging', labelKey: 'admin.nav.messaging', icon: MessageCircle, permission: 'messaging' },
    { href: '/admin/ideas', labelKey: 'admin.nav.ideas', icon: Lightbulb, permission: 'events' },
    { href: '/admin/partnerships', labelKey: 'admin.nav.partnerships', icon: Handshake, permission: 'contact' },
    { href: '/admin/contact', labelKey: 'admin.nav.contact', icon: Mail, permission: 'contact' },
    { href: '/admin/feedback', labelKey: 'admin.nav.feedback', icon: Briefcase, permission: 'feedback' },
    { href: '/admin/sponsors', labelKey: 'admin.nav.sponsors', icon: Building, permission: 'sponsors' },
    { href: '/admin/team', labelKey: 'admin.nav.team', icon: Users2, permission: 'team' },
  ], []);

  const navItems = useMemo(() => {
    if (!currentAdmin) return [];
    return allAdminNavItems
      .filter(item => hasPermission(currentAdmin.role, item.permission as PagePermission))
      .map(item => ({ ...item, label: t(item.labelKey) }));
  }, [currentAdmin, allAdminNavItems, t]);

  useEffect(() => {
    if (!isLoading && !isAdminAuthenticated && !isLoginPage) {
      router.push('/admin/login');
    }
     if (!isLoading && isAdminAuthenticated && isLoginPage) {
      router.push('/admin');
    }
  }, [isLoading, isAdminAuthenticated, router, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading || !isAdminAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (currentAdmin) {
    const currentNavItem = allAdminNavItems.find(item => pathname.startsWith(item.href));
    if (currentNavItem && !hasPermission(currentAdmin.role, currentNavItem.permission as PagePermission)) {
      return (
          <SidebarLayout
            navItems={navItems}
            account={currentAdmin ? { name: currentAdmin.name, email: currentAdmin.email } : null}
            onLogout={logout}
          >
               <div className="flex h-full w-full items-center justify-center">
                  <p>{t('errors.accessDenied')}</p>
               </div>
          </SidebarLayout>
      );
    }
  }


  return (
    <SidebarLayout
      navItems={navItems}
      account={currentAdmin ? { name: currentAdmin.name, email: currentAdmin.email } : null}
      onLogout={logout}
    >
      {children}
    </SidebarLayout>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { language } = useLanguage();
  return (
    <div dir={language === 'fa' ? 'rtl' : 'ltr'}>
      <AdminAuthProvider>
          <ProtectedAdminLayout>{children}</ProtectedAdminLayout>
      </AdminAuthProvider>
    </div>
  );
}
