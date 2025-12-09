'use client';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/language-provider';
import { Logo } from './icons/logo';

export function AppFooter() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-border/40">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Logo className="h-8 w-auto text-primary" />
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built for thoughtful conversations
          </p>
        </div>
        <nav className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/about" className="transition-colors hover:text-foreground">{t('nav.about')}</Link>
          <Link href="/contact" className="transition-colors hover:text-foreground">{t('nav.contact')}</Link>
          <Link href="/faq" className="transition-colors hover:text-foreground">{t('nav.faq')}</Link>
          <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
          <Link href="/terms" className="transition-colors hover:text-foreground">Terms</Link>
          {process.env.NODE_ENV === 'development' && (
             <Link href="/api-docs" className="transition-colors hover:text-foreground">API Docs</Link>
          )}
        </nav>
      </div>
    </footer>
  );
}
