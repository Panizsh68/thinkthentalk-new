
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
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitcher } from './language-switcher';
import { useLanguage } from '@/lib/i18n/language-provider';
import { cn } from '@/lib/utils';
import { Logo } from './icons/logo';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

export function SidebarLayout({
  children,
  navItems,
  onLogout,
}: {
  children: React.ReactNode;
  navItems: NavItem[];
  account?: { name?: string; email?: string } | null;
  onLogout?: () => void;
}) {
  const pathname = usePathname();
  const { t, language } = useLanguage();
  const isRTL = language === 'fa';

  return (
    <SidebarProvider>
      <div className={cn("flex min-h-screen bg-background w-full", isRTL ? "font-vazir" : "font-sans")}>
        <Sidebar side={isRTL ? "right" : "left"} collapsible="icon" className="transition-all duration-300">
          <SidebarHeader className="h-16 flex items-center justify-center border-b">
            <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
              <Logo className="h-8 w-auto text-primary" />
              <span className="font-bold text-sm truncate">Think Then Talk</span>
            </Link>
            <div className="hidden group-data-[collapsible=icon]:block">
               <Logo width={32} height={32} className="h-8 w-8 object-contain" />
            </div>
          </SidebarHeader>
          <SidebarContent className="py-4">
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "flex items-center gap-3 px-4 py-6 transition-all",
                        isRTL ? "flex-row-reverse text-right" : "flex-row text-left",
                        isActive ? "bg-primary/10 text-primary hover:bg-primary/15" : "text-muted-foreground hover:bg-accent"
                      )}
                    >
                      <Link href={item.href} className={cn("flex items-center gap-3 w-full", isRTL && "flex-row-reverse")}>
                        <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={cn("flex items-center gap-3 px-4 py-6", isRTL ? "flex-row-reverse text-right" : "flex-row text-left")}>
                  <Link href="/" className={cn("flex items-center gap-3 w-full", isRTL && "flex-row-reverse")}>
                    <Home className="h-5 w-5" />
                    <span>{t('nav.home')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-1 flex-col transition-all duration-300">
          <header className={cn(
            "flex h-16 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur px-4 md:px-6 sticky top-0 z-30",
            isRTL ? "flex-row-reverse" : "flex-row"
          )}>
            <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
              <SidebarTrigger className="h-9 w-9" />
              <Separator orientation="vertical" className="h-6 hidden md:block" />
              <h2 className="text-sm font-semibold hidden md:block">
                {navItems.find(item => pathname.startsWith(item.href))?.label || ''}
              </h2>
            </div>
            
            <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
              <LanguageSwitcher />
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={onLogout} className="text-muted-foreground hover:text-destructive">
                {t('actions.logout')}
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
