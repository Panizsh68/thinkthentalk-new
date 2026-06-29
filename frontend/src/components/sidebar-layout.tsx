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
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Home, LogOut, User, Menu } from 'lucide-react';
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
  account,
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
        <Sidebar side={isRTL ? "right" : "left"} collapsible="icon">
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
                      <Link href={item.href}>
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
                <SidebarMenuButton
                  asChild
                  className={cn("flex items-center gap-3 px-4 py-6", isRTL ? "flex-row-reverse text-right" : "flex-row text-left")}
                >
                  <Link href="/">
                    <Home className="h-5 w-5" />
                    <span>{t('nav.home')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-1 flex-col">
          <header className={cn(
            "flex h-16 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur px-4 md:px-6 sticky top-0 z-30 shadow-sm",
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
              {account && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className={cn("flex items-center gap-2 px-2 hover:bg-accent rounded-full", isRTL && "flex-row-reverse")}>
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {account.name?.charAt(0) || 'U'}
                      </div>
                      <div className={cn("hidden lg:flex flex-col items-start text-xs", isRTL && "items-end")}>
                        <span className="font-semibold line-clamp-1">{account.name}</span>
                        <span className="text-muted-foreground line-clamp-1">{account.email}</span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56">
                    <DropdownMenuLabel className={cn("font-normal", isRTL && "text-right")} dir={isRTL ? 'rtl' : 'ltr'}>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{account.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{account.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className={cn(isRTL && "flex-row-reverse justify-start")}>
                      <Link href="/profile">
                        <User className={cn(isRTL ? "ml-2" : "mr-2", "h-4 w-4")} />
                        <span>{t('profile.title')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={onLogout} className={cn("text-destructive focus:bg-destructive/10", isRTL && "flex-row-reverse justify-start")}>
                      <LogOut className={cn(isRTL ? "ml-2" : "mr-2", "h-4 w-4")} />
                      <span>{t('actions.logout')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
