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
import { Lightbulb, Users, HeartHandshake, ArrowRight, Quote, Sparkles, Calendar, MapPin, Ticket, Star } from "lucide-react";
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
    <section className="relative h-screen min-h-[700px] w-full flex items-center justify-center text-center text-white overflow-hidden">
      {PlaceHolderImages.map((image, index) => (
        <div key={image.id} className="absolute inset-0">
          <Image
            src={image.imageUrl}
            alt={image.description}
            fill
            className={cn(
              "object-cover transition-opacity ease-in-out scale-105",
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            )}
            style={{ transitionDuration: '2000ms' }}
            data-ai-hint={image.imageHint}
            priority={index === 0}
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      <div className="relative z-10 container flex max-w-[72rem] flex-col items-center gap-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <Badge variant="outline" className="text-white border-white/20 bg-white/10 backdrop-blur-md px-6 py-2 mb-4 text-sm font-medium tracking-widest uppercase">
          {t('home.hero.kicker')}
        </Badge>
        <h1 className="text-5xl sm:text-7xl lg:text-8xl text-white tracking-tighter drop-shadow-lg font-bold leading-tight">
          {t('home.hero.title')}
        </h1>
        <p className="max-w-[42rem] leading-relaxed sm:text-xl text-slate-100 font-light opacity-90 mx-auto mt-4">
          {t('home.hero.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button size="lg" className="h-16 px-10 text-xl rounded-full shadow-2xl hover:shadow-primary/40 transition-all bg-primary hover:bg-primary/90 text-primary-foreground group" onClick={() => router.push('/events')}>
            {t('home.hero.browseButton')}
            <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function ExperienceCard({ event, isFeatured }: { event: Event, isFeatured?: boolean }) {
  const { t, language } = useLanguage();
  const eventTitle = getLocalizedTextValue(event.title, language);
  const eventSummary = getLocalizedTextValue(event.summary, language);
  const formattedDate = formatEventDate(event, language);
  const minPrice = getMinPrice(event.tickets);
  const past = isEventPast(event);

  return (
    <Link href={getEventPath(event)} className="group block h-full">
      <Card className={cn("h-full flex flex-col border-border/10 shadow-lg overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20 bg-card/60 backdrop-blur-sm", isFeatured && "ring-2 ring-primary ring-offset-4 ring-offset-background")}>
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
           <div className="absolute top-4 right-4 z-10 flex gap-2">
            {isFeatured && <Badge variant="default" className="bg-primary text-primary-foreground shadow-md">{t('home.events.featured')}</Badge>}
            <Badge variant={past ? "secondary" : "default"} className="backdrop-blur-md shadow-md bg-background/60 text-foreground">
              {past ? t('event.finished') : t('event.upcoming')}
            </Badge>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 transition-opacity group-hover:opacity-90" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="text-2xl font-bold tracking-tight mb-1 drop-shadow-md">{eventTitle}</h3>
            <p className="text-sm opacity-90 font-medium">{formattedDate}</p>
          </div>
        </div>
        <CardContent className="p-6 flex-grow space-y-4">
          <p className="text-base text-muted-foreground line-clamp-2 leading-relaxed">
            {eventSummary}
          </p>
          <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-muted-foreground font-medium pt-4 border-t border-border/10">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" />
              {event.type === 'ONLINE' ? t('event.online') : getLocalizedTextValue(event.city || {fa: '', en: ''}, language)}
            </div>
            {minPrice !== null && (
              <div className="flex items-center gap-1.5">
                <Ticket className="h-4 w-4 text-primary" />
                {getFormattedPrice(minPrice, event.tickets[0].currency, t)}
              </div>
            )}
            {event.showRemainingCapacity && event.capacityRemaining > 0 && (
              <div className="flex items-center gap-1.5 text-accent-foreground font-semibold">
                <Users className="h-4 w-4" />
                {t('home.events.spotsLeft', { count: event.capacityRemaining })}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="px-6 pb-6 pt-0">
          <span className="text-base font-bold text-primary flex items-center gap-2 transition-all group-hover:gap-3">
            {t('event.viewDetails')}
            <ArrowRight className="h-5 w-5 rtl:rotate-180" />
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
            <p className="text-xl text-muted-foreground font-light max-w-3xl mx-auto">{t('home.events.subtitle')}</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[480px] w-full rounded-3xl" />
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
            {events?.map((event, i) => (
              <ExperienceCard key={event.id} event={event} isFeatured={i === 0} />
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

function TestimonialsSection() {
  const { t } = useLanguage();
  const testimonials = [
    {
      name: "Sarah L.",
      role: "Product Manager",
      avatar: "/avatars/01.png",
      quote: "This community has been a game-changer for me. The discussions are always high-quality and have genuinely changed how I approach my work.",
    },
    {
      name: "David C.",
      role: "Software Engineer",
      avatar: "/avatars/02.png",
      quote: "I was tired of superficial networking events. Think Then Talk is the complete opposite. Real conversations with brilliant people.",
    },
    {
      name: "Fatemeh K.",
      role: "UX Designer",
      avatar: "/avatars/03.png",
      quote: "An incredibly welcoming and intelligent group. The topics are always fascinating and the moderation ensures conversations stay on track and respectful.",
    },
  ];

  return (
    <section className="bg-secondary/40 py-32">
      <div className="container max-w-screen-2xl">
        <div className="mb-20 text-center space-y-4">
          <h2 className="text-h2 tracking-tight sm:text-5xl">{t('home.testimonials.title')}</h2>
          <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">{t('home.testimonials.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <Card key={i} className="border-border/10 bg-background/80 backdrop-blur-md shadow-lg p-8 h-full flex flex-col">
              <div className="flex-grow mb-6">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, starI) => (
                    <Star key={starI} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-lg text-foreground/90 mt-4 leading-relaxed">"{testimonial.quote}"</p>
              </div>
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
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
    <section className="bg-secondary/10 py-32">
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
                className="object-cover transition-transform"
                style={{ transitionDuration: '2000ms' }}
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
      <EventsSection />
      <TestimonialsSection />
      <ExperienceSection />
      <AtmosphereSection />
      <InvolvementSection />
    </div>
  );
}
