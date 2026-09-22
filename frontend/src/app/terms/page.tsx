'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-provider';

export default function TermsOfServicePage() {
  const { t } = useLanguage();

  return (
    <div className="container max-w-screen-2xl">
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
        <div className="container flex max-w-[64rem] flex-col items-center gap-6 text-center">
          <h1 className="text-h1">{t('legal.termsTitle')}</h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">{t('legal.termsDescription')}</p>
          <p className="max-w-[48rem] leading-8 text-foreground/85">{t('legal.termsContent')}</p>
          <Button asChild className="rounded-xl"><Link href="/collaborate">{t('legal.continueToCollaboration')}</Link></Button>
        </div>
      </section>
    </div>
  );
}
