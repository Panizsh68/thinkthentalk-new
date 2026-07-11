'use client';

import { Briefcase, CalendarCheck, Coins, LayoutDashboard, Lightbulb, Ticket, User } from 'lucide-react';
import { SidebarLayout } from '@/components/sidebar-layout';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useAuth } from '@/lib/auth/auth-provider';
import { isCoinCenterEnabled } from '@/lib/config/features';

export function UserPanelLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const { currentUser, logout } = useAuth();

  const userNavItems = [
    { href: '/dashboard', label: t('dashboard.title'), icon: LayoutDashboard },
    { href: '/my-events', label: t('dashboard.myRegistrations'), icon: CalendarCheck },
    { href: '/my-ideas', label: t('ideas.panel.navLabel'), icon: Lightbulb },
    { href: '/my-requests', label: t('partnership.panel.navLabel'), icon: Briefcase },
    ...(isCoinCenterEnabled() ? [{ href: '/wallet', label: t('nav.wallet'), icon: Coins }] : []),
    { href: '/subscription', label: t('subscription.title'), icon: Ticket },
    { href: '/profile', label: t('profile.title'), icon: User },
  ];

  const displayNameFa = [currentUser?.firstNameFa, currentUser?.lastNameFa]
    .filter(Boolean)
    .join(' ')
    .trim();
  const displayNameEn = [currentUser?.firstNameEn, currentUser?.lastNameEn]
    .filter(Boolean)
    .join(' ')
    .trim();

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
