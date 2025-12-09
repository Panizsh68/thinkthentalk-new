'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useSponsorsQuery } from '@/hooks/use-sponsor-queries';

function SponsorCard({ sponsor }: { sponsor: { id: string; name: string; productOrTagline?: string | null; logoUrl: string; websiteUrl?: string | null } }) {
  const card = (
    <Card className="group relative flex h-full flex-col items-center justify-center p-6 text-center transition-all duration-300 hover:shadow-lg hover:scale-[1.01]">
      <div className="relative mb-4 h-24 w-24">
        <Image src={sponsor.logoUrl} alt={`${sponsor.name} logo`} fill className="object-contain" />
      </div>
      <h3 className="text-lg font-semibold">{sponsor.name}</h3>
      {sponsor.productOrTagline ? <p className="text-sm text-muted-foreground">{sponsor.productOrTagline}</p> : null}
    </Card>
  );

  if (sponsor.websiteUrl) {
    return (
      <a href={sponsor.websiteUrl} target="_blank" rel="noopener noreferrer" className="block h-full">
        {card}
      </a>
    );
  }

  return card;
}

export default function SponsorsPage() {
  const { t } = useLanguage();
  const { data: sponsors, isLoading, error } = useSponsorsQuery();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      );
    }
    if (error) {
      return <p className="text-destructive text-center">{t('errors.genericTitle')}</p>;
    }
    if (!sponsors || sponsors.length === 0) {
      return <p className="text-center text-muted-foreground">{t('home.sponsors.noSponsors')}</p>;
    }

    return (
      <>
        <div className="md:hidden overflow-x-auto pb-4">
          <div className="flex gap-4">
            {sponsors.map(sponsor => (
              <div key={sponsor.id} className="w-[60%] sm:w-[40%] shrink-0">
                <SponsorCard sponsor={sponsor} />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
          {sponsors.map(sponsor => (
            <div key={sponsor.id} className="h-full">
              <SponsorCard sponsor={sponsor} />
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <main className="bg-muted py-16 min-h-[70vh]">
      <div className="container max-w-screen-2xl">
        <div className="mb-12 text-center">
          <h1 className="text-h1">{t('home.sponsors.title')}</h1>
          <p className="mt-4 text-xl text-muted-foreground">{t('home.sponsors.subtitle')}</p>
        </div>
        {renderContent()}
      </div>
    </main>
  );
}
