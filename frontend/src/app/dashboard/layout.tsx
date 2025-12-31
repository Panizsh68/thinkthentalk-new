'use client';
import { SidebarLayout } from '@/components/sidebar-layout';
import { User, CalendarCheck } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useAuth } from '@/lib/auth/auth-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
  const { currentUser, logout } = useAuth();

  const userNavItems = [
    { href: '/dashboard', label: t('dashboard.myRegistrations'), icon: CalendarCheck },
    { href: '/profile', label: t('profile.title'), icon: User },
  ];

  const displayNameFa = [currentUser?.firstNameFa, currentUser?.lastNameFa].filter(Boolean).join(' ').trim();
  const displayNameEn = [currentUser?.firstNameEn, currentUser?.lastNameEn].filter(Boolean).join(' ').trim();
  const account = currentUser
    ? {
        name: displayNameFa || displayNameEn || currentUser.mobile,
        email: currentUser.email,
      }
    : null;

  return (
    <SidebarLayout navItems={userNavItems} account={account} onLogout={logout}>
      {children}
    </SidebarLayout>
  );
}
