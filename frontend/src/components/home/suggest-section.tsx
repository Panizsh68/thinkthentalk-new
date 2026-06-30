'use client';
import Link from 'next/link';
import { PenTool, Quote, MapPin, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-provider";

export function SuggestSection() {
  const { t } = useLanguage();

  const suggestionCards = [
    { label: t('home.suggest.cards.flow'), icon: PenTool },
    { label: t('home.suggest.cards.prompts'), icon: Quote },
    { label: t('home.suggest.cards.venues'), icon: MapPin },
    { label: t('home.suggest.cards.chapters'), icon: Rocket },
  ];

  return (
    <section className="py-20 md:py-24 px-4">
      <div className="container max-w-screen-2xl">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center bg-primary/5 rounded-[2.5rem] p-8 md:p-12 border border-primary/10 overflow-hidden relative">
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">{t('home.suggest.title')}</h2>
              <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-md">
                {t('home.suggest.subtitle')}
              </p>
            </div>
            <Button size="lg" className="rounded-full font-bold shadow-md" asChild>
              <Link href="/ideas">{t('home.suggest.cta')}</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
              {suggestionCards.map((card, i) => (
                <div key={i} className="bg-background border rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-center shadow-sm hover:border-primary/40 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <card.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-bold text-foreground/80">{card.label}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
