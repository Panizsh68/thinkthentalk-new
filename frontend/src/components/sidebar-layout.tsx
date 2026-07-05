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
  useSidebar,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Home, LogOut } from 'lucide-react';
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

function SidebarHeaderWithLogo() {
  const { state } = useSidebar();
  
  return (
    <SidebarHeader className="h-16 flex items-center px-4">
      <Link href="/" className="flex items-center gap-3 w-full transition-all duration-300 group">
        <div className={cn(
          "flex items-center justify-center shrink-0 transition-all duration-500 ease-in-out",
          state === "collapsed" ? "w-10 h-10" : "w-8 h-8"
        )}>
          <Logo width={32} height={32} className="h-full w-full object-contain group-hover:scale-110 transition-transform" />
        </div>
        <span className={cn(
          "font-black text-lg tracking-tight truncate transition-all duration-300 ease-in-out",
          state === "collapsed" ? "opacity-0 w-0" : "opacity-100 w-auto"
        )}>
          Think Then Talk
        </span>
      </Link>
    </SidebarHeader>
  );
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
      <div className={cn("flex min-h-screen bg-background w-full transition-all duration-300", isRTL ? "font-vazir" : "font-inter")}>
        <Sidebar side={isRTL ? "right" : "left"} collapsible="icon" className="border-border/40 shadow-xl z-40">
          <SidebarHeaderWithLogo />
          
          <SidebarContent className="px-3">
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
                        "transition-all duration-200",
                        isRTL && "flex-row-reverse"
                      )}
                    >
                      <Link href={item.href} className={cn("flex items-center w-full gap-3", isRTL && "flex-row-reverse")}>
                        <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground")} />
                        <span className="font-semibold">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t('nav.home')}>
                  <Link href="/" className={cn("flex items-center w-full gap-3", isRTL && "flex-row-reverse")}>
                    <Home className="h-5 w-5" />
                    <span className="font-semibold">{t('nav.home')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onLogout} tooltip={t('actions.logout')} className="text-muted-foreground hover:text-destructive">
                   <div className={cn("flex items-center w-full gap-3", isRTL && "flex-row-reverse")}>
                    <LogOut className="h-5 w-5" />
                    <span className="font-semibold">{t('actions.logout')}</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className={cn(
          "bg-background flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
          "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:border md:peer-data-[variant=inset]:shadow",
          isRTL ? "md:peer-data-[state=expanded]:mr-[var(--sidebar-width)] md:peer-data-[state=collapsed]:mr-[var(--sidebar-width-icon)]" 
                : "md:peer-data-[state=expanded]:ml-[var(--sidebar-width)] md:peer-data-[state=collapsed]:ml-[var(--sidebar-width-icon)]"
        )}>
          <header className={cn(
            "flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-md px-4 md:px-6 sticky top-0 z-30 transition-all duration-300 shadow-sm",
            isRTL ? "flex-row-reverse" : "flex-row"
          )}>
            <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
              <SidebarTrigger className="h-9 w-9" />
              <Separator orientation="vertical" className="h-6 hidden md:block bg-border/60" />
              <h2 className="text-sm font-bold tracking-tight text-foreground/80 hidden md:block">
                {navItems.find(item => pathname.startsWith(item.href))?.label || ''}
              </h2>
            </div>
            
            <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
              <div className="hidden sm:flex items-center gap-2">
                <LanguageSwitcher />
                <Separator orientation="vertical" className="h-4 bg-border/40" />
                <ThemeToggle />
              </div>
              
              {account && (
                <div className={cn("flex items-center gap-3 pl-2 transition-all", isRTL ? "flex-row-reverse pr-2 pl-0 border-r" : "border-l")}>
                  <div className={cn("flex flex-col text-right", !isRTL && "text-left")}>
                    <span className="text-xs font-black truncate max-w-[120px]">{account.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{account.email}</span>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase shadow-inner">
                    {account.name?.charAt(0) || 'U'}
                  </div>
                </div>
              )}
            </div>
          </header>
          
          <main className="flex-1 overflow-x-hidden p-4 md:p-8 lg:p-10 transition-all duration-300">
            <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
