'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type CoinCenterMaintenanceProps = {
  className?: string;
  compact?: boolean;
};

export function CoinCenterMaintenance({ className, compact = false }: CoinCenterMaintenanceProps) {
  const { language } = useLanguage();
  const isRTL = language === 'fa';

  const copy =
    language === 'fa'
      ? {
          badge: 'در حال توسعه',
          title: 'مرکز سکه موقتاً غیرفعال است',
          description:
            'این بخش فعلاً از سایت خارج شده و در حال بازطراحی است. هیچ لینک یا عملکرد فعالی برای کاربران نمایش داده نمی‌شود.',
          noteTitle: 'وضعیت فعلی',
          noteBody: 'صفحه و مسیرها حفظ شده‌اند تا بعداً بدون تغییر اساسی دوباره فعال شوند.',
          dashboard: 'رفتن به داشبورد',
          events: 'مشاهده رویدادها',
        }
      : {
          badge: 'Under development',
          title: 'Coin Center is temporarily disabled',
          description:
            'This section is hidden from the site while we rebuild it. No active links or actions are shown to users.',
          noteTitle: 'Current state',
          noteBody: 'The page and routes stay in place so they can be re-enabled later without a rewrite.',
          dashboard: 'Go to dashboard',
          events: 'Browse events',
        };

  return (
    <Card
      className={cn(
        'overflow-hidden border-border/50 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-2xl',
        compact ? 'w-full' : 'w-full max-w-4xl',
        className,
      )}
    >
      <CardHeader className="space-y-4 p-8">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-cyan-100">
          <AlertTriangle className="h-3.5 w-3.5" />
          {copy.badge}
        </div>
        <CardTitle className="text-3xl font-black tracking-tight md:text-4xl">{copy.title}</CardTitle>
        <CardDescription className={cn('max-w-2xl text-slate-300', isRTL && 'text-right')}>
          {copy.description}
        </CardDescription>
      </CardHeader>
      <CardContent className={cn('grid gap-4 p-8 pt-0 md:grid-cols-[1.2fr_0.8fr]', isRTL && 'text-right')}>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-slate-200">{copy.noteTitle}</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{copy.noteBody}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-slate-200">
            {language === 'fa' ? 'دسترسی‌های جایگزین' : 'Alternative access'}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {language === 'fa'
              ? 'می‌توانید به داشبورد بروید یا فهرست رویدادها را بررسی کنید.'
              : 'You can head to your dashboard or continue to the events list.'}
          </p>
        </div>
        <div className={cn('flex flex-col gap-3 pt-2 sm:flex-row', isRTL && 'sm:flex-row-reverse')}>
          <Button asChild className="rounded-2xl bg-cyan-300 font-black text-slate-950 hover:bg-cyan-200">
            <Link href="/dashboard">{copy.dashboard}</Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/events">{copy.events}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
