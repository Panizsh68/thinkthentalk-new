'use client';
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const isRTL = language === 'fa';

  return (
    <section className="relative min-h-[85vh] w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/static-images/group-photo-1.jpg"
          alt="Think Then Talk Community"
          fill
          className="object-cover opacity-30 grayscale-[0.2]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/90 to-background" />
      </div>

      <div className="relative z-10 container flex max-w-[72rem] flex-col items-center gap-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000 px-4">
        <Badge variant="outline" className="px-4 py-1 border-primary/30 bg-primary/5 backdrop-blur-sm text-primary font-bold uppercase tracking-wider mb-2">
          {t('home.hero.kicker')}
        </Badge>
        <h1 className="text-4xl sm:text-6xl lg:text-7xl tracking-tighter font-black leading-[1.1] text-foreground">
          {t('home.hero.title')}
        </h1>
        <p className="max-w-[42rem] leading-relaxed text-lg sm:text-xl text-muted-foreground font-medium mx-auto">
          {t('home.hero.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <Button 
            size="lg" 
            className="h-14 px-8 text-lg rounded-full shadow-lg transition-all bg-primary hover:bg-primary/90 text-primary-foreground group"
            onClick={() => router.push('/events')}
          >
            {t('home.hero.primaryCTA')}
            <ArrowRight className={cn("ml-2 h-5 w-5 transition-transform group-hover:translate-x-1", isRTL && "rotate-180")} />
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="h-14 px-8 text-lg rounded-full border-primary/20 hover:bg-primary/5 transition-all"
            onClick={() => {
              const el = document.getElementById('season-one');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {t('home.hero.secondaryCTA')}
          </Button>
        </div>
      </div>
    </section>
  );
}
