'use client';
import { SidebarLayout } from '@/components/sidebar-layout';
import { User, CalendarCheck } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-provider';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useLanguage();

  const userNavItems = [
    { href: '/dashboard', label: t('dashboard.myRegistrations'), icon: CalendarCheck },
    { href: '/profile', label: t('profile.title'), icon: User },
  ];
  
  return <SidebarLayout navItems={userNavItems}>{children}</SidebarLayout>;
}
