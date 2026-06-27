'use client';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-provider";
import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useEventsQuery } from "@/hooks/use-event-queries";
import { Skeleton } from "@/components/ui/skeleton";
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lightbulb, Users, HeartHandshake, ArrowRight, Quote, Sparkles, Calendar, MapPin, Ticket } from "lucide-react";
import { getLocalizedTextValue } from "@/lib/i18n/get-localized-text";
import { formatEventDate, getEventPath, getMinPrice, getFormattedPrice, isEventPast } from "@/lib/event-helpers";
import type { Event } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

function HeroSection() {
  const { t } = useLanguage();
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === PlaceHolderImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-[90vh] min-h-[600px] w-full flex items-center justify-center text-center text-white overflow-hidden">
      {PlaceHolderImages.map((image, index) => (
        <Image
          key={image.id}
          src={image.imageUrl}
          alt={image.description}
          fill
          className={cn(
            "object-cover transition-opacity ease-in-out scale-105",
            "[transition-duration:2000ms]",
            index === currentImageIndex ? "opacity-100" : "opacity-0"
          )}
          data-ai-hint={image.imageHint}
          priority={index === 0}
        />
      ))}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      <div className="relative z-10 container flex max-w-[64rem] flex-col items-center gap-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <Badge variant="outline" className="text-white border-white/20 bg-white/10 backdrop-blur-md px-6 py-2 mb-4 text-sm font-medium tracking-widest uppercase">
          {t('home.hero.kicker')}
        </Badge>
        <h1 className="text-h1 sm:text-7xl text-white tracking-tighter drop-shadow-md font-bold leading-tight">
          {t('home.hero.title')}
        </h1>
        <p className="max-w-[36rem] leading-relaxed sm:text-2xl text-slate-100 font-light opacity-90 mx-auto">
          {t('home.hero.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-12">
          <Button size="lg" className="h-16 px-10 text-xl rounded-full shadow-2xl hover:shadow-primary/40 transition-all bg-primary hover:bg-primary/90 text-primary-foreground group" onClick={() => router.push('/events')}>
            {t('home.hero.browseButton')}
            <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function ExperienceCard({ event }: { event: Event }) {
  const { t, language } = useLanguage();
  const eventTitle = getLocalizedTextValue(event.title, language);
  const eventSummary = getLocalizedTextValue(event.summary, language);
  const formattedDate = formatEventDate(event, language);
  const minPrice = getMinPrice(event.tickets);
  const past = isEventPast(event);

  return (
    <Link href={getEventPath(event)} className="group block h-full">
      <Card className="h-full flex flex-col border-none shadow-lg overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl bg-card/60 backdrop-blur-sm">
        <div className="relative aspect-[4/3] overflow-hidden">
          {event.posterUrl ? (
            <Image 
              src={event.posterUrl} 
              alt={eventTitle} 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              data-ai-hint="event cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Sparkles className="h-12 w-12 text-muted-foreground/20" />
            </div>
          )}
          <div className="absolute top-4 right-4 z-10">
            <Badge variant={past ? "secondary" : "default"} className="backdrop-blur-md shadow-md">
              {past ? t('event.finished') : t('event.upcoming')}
            </Badge>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="text-xl font-bold tracking-tight mb-1">{eventTitle}</h3>
            <p className="text-xs opacity-90 line-clamp-1">{formattedDate}</p>
          </div>
        </div>
        <CardContent className="p-6 flex-grow space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {eventSummary}
          </p>
          <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs text-muted-foreground font-medium pt-2 border-t">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {event.type === 'ONLINE' ? t('event.online') : getLocalizedTextValue(event.city || {fa: '', en: ''}, language)}
            </div>
            {minPrice !== null && (
              <div className="flex items-center gap-1.5">
                <Ticket className="h-3.5 w-3.5 text-primary" />
                {getFormattedPrice(minPrice, event.tickets[0].currency, t)}
              </div>
            )}
            {event.showRemainingCapacity && event.capacityRemaining > 0 && (
              <div className="flex items-center gap-1.5 text-accent">
                <Users className="h-3.5 w-3.5" />
                {t('home.events.spotsLeft', { count: event.capacityRemaining })}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="px-6 pb-6 pt-0">
          <span className="text-sm font-bold text-primary flex items-center gap-1 transition-all group-hover:gap-2">
            {t('event.viewDetails')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

function EventsSection() {
  const { t } = useLanguage();
  const { data: events, isLoading, error } = useEventsQuery({
    forHomepage: true,
    showPastEvents: true,
    limit: 3,
    sortBy: 'startDateTime',
    sortOrder: 'asc',
  });

  return (
    <section className="container max-w-screen-2xl py-32">
        <div className="mb-20 text-center space-y-4">
            <h2 className="text-h2 tracking-tight sm:text-5xl">{t('home.events.title')}</h2>
            <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">{t('home.events.subtitle')}</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[450px] w-full rounded-3xl" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 rounded-3xl bg-destructive/5 text-center">
            <p className="text-destructive">{t('errors.fetchEvents')}</p>
          </div>
        ) : events?.length === 0 ? (
          <p className="text-muted-foreground text-center py-24 bg-secondary/10 rounded-3xl">{t('events.noEvents')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {events?.map((event) => (
              <ExperienceCard key={event.id} event={event} />
            ))}
          </div>
        )}

        <div className="mt-20 text-center">
            <Button size="lg" variant="outline" className="rounded-full px-12 h-14 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all font-bold" asChild>
                <Link href="/events">{t('home.events.viewAllButton')}</Link>
            </Button>
        </div>
    </section>
  );
}

function InvolvementSection() {
  const { t, language } = useLanguage();
  const isRTL = language === 'fa';

  const paths = [
    {
      title: t('nav.collaborate'),
      description: t('home.involved.collaborateDesc'),
      icon: Users,
      href: '/collaborate',
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-500/10'
    },
    {
      title: t('nav.ideas'),
      description: t('home.involved.ideasDesc'),
      icon: Lightbulb,
      href: '/ideas',
      color: 'text-yellow-500',
      bg: 'bg-yellow-50 dark:bg-yellow-500/10'
    },
    {
      title: t('nav.sponsorship'),
      description: t('home.involved.sponsorshipDesc'),
      icon: HeartHandshake,
      href: '/sponsorship',
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-500/10'
    }
  ];

  return (
    <section className="bg-secondary/40 py-32">
      <div className="container max-w-screen-2xl">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-h2 tracking-tight sm:text-5xl">{t('home.involved.title')}</h2>
          <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">{t('home.involved.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {paths.map((path) => (
            <Link key={path.href} href={path.href} className="group h-full">
              <Card className="h-full border-none bg-background/80 backdrop-blur-md shadow-lg transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-1 overflow-hidden relative">
                <div className={cn("absolute top-0 left-0 w-1 h-full transition-all duration-500 group-hover:w-2", path.color.replace('text-', 'bg-'))} />
                <CardHeader className="pb-4">
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3", path.bg)}>
                    <path.icon className={cn("h-8 w-8", path.color)} />
                  </div>
                  <CardTitle className="text-2xl font-bold">{path.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {path.description}
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <span className="text-sm font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                    {t('actions.view')}
                    <ArrowRight className={cn("h-4 w-4 transition-transform", isRTL ? "rotate-180" : "")} />
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function AtmosphereSection() {
  const { t } = useLanguage();
  return (
    <section className="py-32">
      <div className="container max-w-screen-2xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <h2 className="text-h2 tracking-tight sm:text-5xl">{t('home.moments.title')}</h2>
            <p className="text-xl text-muted-foreground font-light max-w-2xl">{t('home.moments.subtitle')}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-[600px]">
          {PlaceHolderImages.slice(0, 4).map((image, i) => (
            <div 
              key={image.id} 
              className={cn(
                "relative overflow-hidden rounded-3xl group cursor-crosshair",
                i === 0 && "col-span-2 row-span-2",
                i === 1 && "col-span-2 row-span-1",
              )}
            >
              <Image 
                src={image.imageUrl} 
                alt={image.description} 
                fill 
                className="object-cover transition-transform duration-[2000ms] group-hover:scale-110" 
                data-ai-hint={image.imageHint}
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex items-end p-8">
                <p className="text-white text-sm font-medium tracking-wide translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                  {image.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExperienceSection() {
  const { t, language } = useLanguage();
  const isRTL = language === 'fa';

  return (
    <section className="py-32 bg-secondary/10">
      <div className="container max-w-screen-2xl">
        <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-20 items-center", isRTL && "text-right")}>
          <div className="space-y-10">
            <div className="space-y-6">
              <Badge variant="secondary" className="px-4 py-1 text-primary">
                {t('home.experience.title')}
              </Badge>
              <h2 className="text-h2 tracking-tight sm:text-5xl">
                {t('home.experience.subtitle')}
              </h2>
            </div>
            
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-6 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-background shadow-sm border flex items-center justify-center transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <span className="font-bold text-lg">{i}</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-xl">{t(`home.experience.perk${i}.title`)}</h3>
                    <p className="text-muted-foreground leading-relaxed">{t(`home.experience.perk${i}.desc`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
             <div className="absolute -inset-10 bg-primary/10 rounded-full blur-[120px] opacity-30 animate-pulse" />
             <Card className="relative border-none bg-background/40 backdrop-blur-xl p-12 shadow-2xl rounded-[3rem] overflow-hidden">
                <Quote className="h-16 w-16 text-primary/10 mb-8" />
                <p className="text-2xl sm:text-3xl font-serif italic text-foreground/90 leading-relaxed mb-10 tracking-tight">
                  {t('home.experience.simulation.quote')}
                </p>
                <div className="flex items-center gap-6">
                  <div className="w-16 h-0.5 bg-primary/30 rounded-full" />
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-primary/60">
                    {t('home.experience.simulation.caption')}
                  </span>
                </div>
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
             </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col gap-0 pb-16">
      <HeroSection />
      <ExperienceSection />
      <EventsSection />
      <AtmosphereSection />
      <InvolvementSection />
    </div>
  );
}
