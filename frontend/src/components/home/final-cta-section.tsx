'use client';
import Link from 'next/link';
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

export function FinalCTASection() {
  const { t, language } = useLanguage();
  const isRTL = language === 'fa';

  return (
    <section className="py-24 md:py-36 text-center relative overflow-hidden px-4">
      <div className="container max-w-3xl relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
          {t('home.final.title')}
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-xl mx-auto">
          {t('home.final.subtitle')}
        </p>
        <div className="pt-4">
           <Button size="lg" className="h-14 px-10 rounded-full text-lg font-bold shadow-lg group" asChild>
             <Link href="/login">
               {t('home.final.cta')}
               <ArrowRight className={cn("ml-2 h-5 w-5 transition-transform group-hover:translate-x-1", isRTL && "rotate-180")} />
             </Link>
           </Button>
        </div>
      </div>
    </section>
  );
}
