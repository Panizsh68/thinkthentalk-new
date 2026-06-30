'use client';
import Link from 'next/link';
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

export function CollaborateSection() {
  const { t, language } = useLanguage();
  const isRTL = language === 'fa';
  
  return (
    <section className="py-20 md:py-24 px-4">
      <div className="container max-w-screen-2xl">
        <div className="bg-foreground text-background rounded-[2.5rem] p-8 md:p-12 overflow-hidden shadow-xl grid lg:grid-cols-[1fr_1.5fr] gap-12 items-center">
          <div className="relative aspect-square md:aspect-video lg:aspect-square">
             <Image 
                src="/static-images/group-photo-3.jpg"
                alt="Community Collaboration"
                fill
                className="object-cover rounded-[1.5rem] opacity-70"
             />
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Badge variant="outline" className="text-primary border-primary px-3 py-1 rounded-full font-bold uppercase tracking-widest text-[10px]">
                Work with us
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                {t('home.collaborate.title')}
              </h2>
              <p className="text-lg opacity-80 font-medium leading-relaxed max-w-xl">
                {t('home.collaborate.subtitle')}
              </p>
            </div>

            <Button size="lg" variant="secondary" className="rounded-full font-bold group" asChild>
               <Link href="/collaborate">
                {t('home.collaborate.cta')}
                <ArrowRight className={cn("ml-2 h-4 w-4 transition-transform group-hover:translate-x-1", isRTL && "rotate-180")} />
               </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
