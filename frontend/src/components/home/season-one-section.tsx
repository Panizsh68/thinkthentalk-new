'use client';
import { Calendar, Users, Camera, Quote, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n/language-provider";

export function SeasonOneSection() {
  const { t } = useLanguage();

  const stats = [
    { label: t('home.seasonOne.stats.events'), value: t('home.seasonOne.stats.eventsValue'), icon: Calendar },
    { label: t('home.seasonOne.stats.participants'), value: t('home.seasonOne.stats.participantsValue'), icon: Users },
    { label: t('home.seasonOne.stats.photos'), value: t('home.seasonOne.stats.photosValue'), icon: Camera },
    { label: t('home.seasonOne.stats.hours'), value: t('home.seasonOne.stats.hoursValue'), icon: Quote },
  ];

  return (
    <section id="season-one" className="py-20 md:py-32 bg-secondary/5 px-4">
      <div className="container max-w-screen-2xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="text-primary bg-primary/10 border-none px-3 py-1 rounded-full font-bold">
                {t('home.seasonOne.kicker')}
              </Badge>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                {t('home.seasonOne.title')}
              </h2>
              <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-xl">
                {t('home.seasonOne.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="p-5 rounded-[2rem] bg-background border border-border/50 shadow-sm transition-transform hover:scale-[1.02]">
                  <stat.icon className="h-5 w-5 text-primary mb-2" />
                  <p className="text-2xl font-black text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative aspect-video rounded-[3rem] overflow-hidden shadow-2xl group bg-black border-8 border-background">
             <video 
                poster="/static-images/group-photo-2.jpg"
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                controls
                src="/static-images/TTT-S1.mp4"
             />
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-all duration-500">
                <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-2xl backdrop-blur-sm">
                  <Play className="h-8 w-8 fill-current ml-1" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}