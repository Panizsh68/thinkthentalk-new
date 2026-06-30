'use client';
import Link from 'next/link';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-provider";
import { useSponsorsQuery } from "@/hooks/use-sponsor-queries";
import { Building2 } from "lucide-react";

export function SponsorshipSection() {
  const { t } = useLanguage();
  const { data: sponsors, isLoading } = useSponsorsQuery();

  return (
    <section className="py-20 md:py-32 bg-primary/[0.02] border-y border-border/40 px-4">
      <div className="container max-w-screen-2xl">
        <div className="max-w-3xl mx-auto text-center space-y-6 mb-16">
           <h2 className="text-3xl md:text-5xl font-black tracking-tight">{t('home.sponsorship.title')}</h2>
           <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
            {t('home.sponsorship.subtitle')}
           </p>
           <Button size="lg" variant="outline" className="h-14 px-8 rounded-full border-2 font-bold shadow-sm hover:bg-primary/5" asChild>
            <Link href="/sponsorship">{t('home.sponsorship.cta')}</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center gap-8 opacity-20">
             {Array.from({ length: 4 }).map((_, i) => (
               <div key={i} className="h-8 w-32 bg-muted animate-pulse rounded" />
             ))}
          </div>
        ) : sponsors && sponsors.length > 0 ? (
          <div className="pt-10">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center opacity-40 grayscale transition-all hover:opacity-100 hover:grayscale-0">
              {sponsors.map(s => (
                  <div key={s.id} className="relative h-8">
                    <Image src={s.logoUrl} alt={s.name} fill className="object-contain" />
                  </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 opacity-40">
             <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
             <p className="text-sm font-medium">{t('home.sponsors.noSponsors')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
