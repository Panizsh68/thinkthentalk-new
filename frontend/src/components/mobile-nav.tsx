
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/language-provider';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { Logo } from './icons/logo';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/events', label: t('nav.events') },
    { href: '/faq', label: t('nav.faq') },
    { href: '/about', label: t('nav.about') },
    { href: '/contact', label: t('nav.contact') },
  ];
  
  if (!isMounted) {
    return null;
  }

  return (
    <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Navigation</span>
            </Button>
        </SheetTrigger>
        <SheetContent side="left">
            <div className="p-4">
            <Link href="/" className="flex items-center gap-2 mb-8" onClick={() => setOpen(false)}>
                <Logo className="h-8 w-auto text-primary" />
                <span className="font-bold">Think Then Talk</span>
            </Link>
            <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="text-lg font-medium text-foreground/80 hover:text-foreground"
                >
                    {link.label}
                </Link>
                ))}
            </nav>
            </div>
        </SheetContent>
        </Sheet>
    </div>
  );
}
