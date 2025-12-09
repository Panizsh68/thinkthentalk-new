
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Home, LogOut, User } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import type { AdminUser } from '@/lib/types';
import { LanguageSwitcher } from './language-switcher';
import { useLanguage } from '@/lib/i18n/language-provider';
import { cn } from '@/lib/utils';


interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

export function SidebarLayout({
  children,
  navItems,
  adminUser,
  onLogout,
}: {
  children: React.ReactNode;
  navItems: NavItem[];
  adminUser: AdminUser | null;
  onLogout?: () => void;
}) {
  const pathname = usePathname();
  const { t, language } = useLanguage();
  const isRTL = language === 'fa';

  return (
    <SidebarProvider>
      <div className={cn("flex min-h-screen bg-background w-full")}>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
                {t('admin.nav.dashboard')}
              </h2>
              <SidebarTrigger className="md:hidden" />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))}
                    tooltip={{ children: item.label }}
                    className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse text-right" : "flex-row text-left")}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="mt-auto">
              <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:flex-col">
                  <Button variant="ghost" size="icon" className="group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8" asChild>
                      <Link href="/">
                          <Home />
                          <span className="sr-only">Back to Home</span>
                      </Link>
                  </Button>
              </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-1 flex-col">
           <header className={cn("flex h-14 items-center justify-between gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30")}>
              <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <SidebarTrigger />
                  <span className="font-semibold lg:hidden">{t('admin.nav.menu')}</span>
              </div>
              
              <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <LanguageSwitcher />
                  <ThemeToggle />
                  {adminUser && (
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                  <User className="h-5 w-5" />
                                  <span className="sr-only">Admin Account</span>
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isRTL ? "start" : "end"}>
                              <DropdownMenuLabel className="font-normal" dir={isRTL ? 'rtl' : 'ltr'}>
                                  <div className="flex flex-col space-y-1">
                                      <p className="text-sm font-medium leading-none">{adminUser.name}</p>
                                      <p className="text-xs leading-none text-muted-foreground">{adminUser.email}</p>
                                  </div>
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={onLogout}>
                                  <LogOut className={cn(isRTL ? "ml-2" : "mr-2", "h-4 w-4")} />
                                  <span>{t('actions.logout')}</span>
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                  )}
              </div>
            </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
