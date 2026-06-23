'use client';
import Link from 'next/link';
import { User, LogIn } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import { LanguageSwitcher } from './language-switcher';
import { useLanguage } from '@/lib/i18n/language-provider';
import { MobileNav } from './mobile-nav';
import { Logo } from './icons/logo';
import { useAuth } from '@/lib/auth/auth-provider';
import { useEffect, useState } from 'react';

export function AppHeader() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Return a stable shell on the server to prevent hydration mismatch
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2" data-testid="nav-logo-link">
            <Logo className="h-8 w-auto text-primary" />
            <span className="hidden font-bold sm:inline-block">
              Think Then Talk
            </span>
          </Link>

          {/* Only render nav links once mounted to ensure consistency with client state/translations */}
          {isMounted && (
            <nav className="hidden items-center gap-6 text-sm lg:flex" aria-label="Main navigation">
              <Link href="/" className="font-medium text-foreground/80 transition-colors hover:text-foreground" data-testid="nav-link-home">{t('nav.home')}</Link>
              <Link href="/events" className="font-medium text-foreground/60 transition-colors hover:text-foreground" data-testid="nav-link-events">{t('nav.events')}</Link>
              <Link href="/ideas" className="font-medium text-foreground/60 transition-colors hover:text-foreground">{t('nav.ideas')}</Link>
              <Link href="/collaborate" className="font-medium text-foreground/60 transition-colors hover:text-foreground">{t('nav.collaborate')}</Link>
              <Link href="/sponsorship" className="font-medium text-foreground/60 transition-colors hover:text-foreground">{t('nav.sponsorship')}</Link>
              <Link href="/faq" className="font-medium text-foreground/60 transition-colors hover:text-foreground" data-testid="nav-link-faq">{t('nav.faq')}</Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isMounted && (
            <>
              <LanguageSwitcher />
              <ThemeToggle />
              {isAuthenticated ? (
                <Button variant="ghost" size="icon" asChild data-testid="user-account-button">
                  <Link href="/dashboard" aria-label={t('nav.myAccount')}>
                    <User />
                  </Link>
                </Button>
              ) : (
                <Button variant="ghost" size="icon" asChild data-testid="login-button">
                  <Link href="/login" aria-label={t('actions.login')}>
                    <LogIn />
                  </Link>
                </Button>
              )}
              <MobileNav />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
