'use client';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-provider";
import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useEventsQuery } from "@/hooks/use-event-queries";
import { useTeamMembersQuery } from "@/hooks/use-team-queries";
import { useSponsorsQuery } from "@/hooks/use-sponsor-queries";
import { Skeleton } from "@/components/ui/skeleton";
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lightbulb, Users, HeartHandshake, ArrowRight, Quote, Sparkles, Calendar, MapPin, Ticket, Star, Play, CheckCircle2, Trophy, Rocket, ShieldCheck, Mail, Camera, Video, PenTool } from "lucide-react";
import { getLocalizedTextValue } from "@/lib/i18n/get-localized-text";
import { formatEventDate, getEventPath, getMinPrice, getFormattedPrice, isEventPast } from "@/lib/event-helpers";
import type { Event } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

/**
 * 1. HERO SECTION
 */
function HeroSection() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const isRTL = language === 'fa';

  return (
    <section className="relative h-[90vh] min-h-[700px] w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1528605248644-14dd04cb11c7?q=80&w=2070&auto=format&fit=crop"
          alt="Community Gathering"
          fill
          className="object-cover scale-105 animate-pulse-slow opacity-40 grayscale-[0.3]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/80 to-background" />
      </div>

      <div className="relative z-10 container flex max-w-[72rem] flex-col items-center gap-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <Badge variant="outline" className="px-6 py-2 border-primary/20 bg-primary/5 backdrop-blur-md text-primary font-bold tracking-widest uppercase mb-4">
          {t('home.hero.kicker')}
        </Badge>
        <h1 className="text-5xl sm:text-7xl lg:text-8xl tracking-tighter font-black leading-[1.1] text-foreground">
          {t('home.hero.title')}
        </h1>
        <p className="max-w-[46rem] leading-relaxed text-lg sm:text-2xl text-muted-foreground font-light mx-auto">
          {t('home.hero.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button 
            size="lg" 
            className="h-16 px-10 text-xl rounded-full shadow-xl hover:shadow-primary/25 transition-all bg-primary hover:bg-primary/90 text-primary-foreground group"
            onClick={() => router.push('/events')}
          >
            {t('home.hero.primaryCTA')}
            <ArrowRight className={cn("ml-2 h-6 w-6 transition-transform group-hover:translate-x-1", isRTL && "rotate-180")} />
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="h-16 px-10 text-xl rounded-full border-primary/20 hover:bg-primary/5 transition-all"
            onClick={() => window.open('#season-one', '_self')}
          >
            <Play className={cn("h-5 w-5 mr-2", isRTL && "ml-2 mr-0")} />
            {t('home.hero.secondaryCTA')}
          </Button>
        </div>
      </div>
    </section>
  );
}

/**
 * 2. UPCOMING EVENTS
 */
function EventsSection() {
  const { t, language } = useLanguage();
  const { data: events, isLoading, error } = useEventsQuery({
    forHomepage: true,
    showPastEvents: false,
    limit: 3,
    sortBy: 'startDateTime',
    sortOrder: 'asc',
  });

  return (
    <section className="container max-w-screen-2xl py-24 md:py-32 border-b border-border/40">
        <div className="mb-16 md:mb-24 text-center space-y-4">
            <h2 className="text-h2 tracking-tight sm:text-5xl">{t('home.events.title')}</h2>
            <p className="text-xl text-muted-foreground font-light max-w-3xl mx-auto">{t('home.events.subtitle')}</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[480px] w-full rounded-[2.5rem]" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 rounded-3xl bg-destructive/5 text-center border border-destructive/10">
            <p className="text-destructive font-medium">{t('errors.fetchEvents')}</p>
          </div>
        ) : events?.length === 0 ? (
          <Card className="border-dashed py-24 text-center bg-muted/30">
            <CardContent>
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg">{t('events.noEvents')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {events?.map((event, i) => (
              <ExperienceCard key={event.id} event={event} isFeatured={i === 0} />
            ))}
          </div>
        )}

        <div className="mt-20 text-center">
            <Button size="lg" variant="ghost" className="rounded-full px-12 h-14 text-primary hover:bg-primary/5 font-bold text-lg" asChild>
                <Link href="/events">{t('home.events.viewAllButton')} <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
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

  return (
    <Link href={getEventPath(event)} className="group block h-full">
      <Card className={cn(
        "h-full flex flex-col border-none shadow-xl overflow-hidden transition-all duration-700 hover:-translate-y-3 bg-card hover:shadow-2xl hover:shadow-primary/10 rounded-[2.5rem]",
        isFeatured && "ring-1 ring-primary/20"
      )}>
        <div className="relative aspect-[4/5] overflow-hidden">
          {event.posterUrl ? (
            <Image 
              src={event.posterUrl} 
              alt={eventTitle} 
              fill 
              className="object-cover transition-transform duration-1000 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-secondary/50 flex items-center justify-center">
              <Sparkles className="h-16 w-16 text-primary/10" />
            </div>
          )}
          
          <div className="absolute top-6 left-6 z-10 flex flex-wrap gap-2">
            {isFeatured && <Badge className="bg-primary text-primary-foreground shadow-lg px-3 py-1">{t('home.events.featured')}</Badge>}
            <Badge variant="secondary" className="backdrop-blur-xl bg-white/70 dark:bg-black/70 text-foreground px-3 py-1">
              {event.type === 'ONLINE' ? t('event.online') : getLocalizedTextValue(event.city || {fa: '', en: ''}, language)}
            </Badge>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
          <div className="absolute bottom-8 left-8 right-8 text-white space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">{formattedDate}</span>
            </div>
            <h3 className="text-2xl font-black tracking-tight">{eventTitle}</h3>
          </div>
        </div>
        <CardContent className="p-8 flex-grow space-y-4">
          <p className="text-muted-foreground line-clamp-3 leading-relaxed">
            {eventSummary}
          </p>
          
          <div className="pt-6 flex items-center justify-between border-t border-border/50">
            <div className="space-y-1">
               <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">{t('event.tickets')}</p>
               <p className="font-black text-lg text-primary">
                {minPrice !== null ? getFormattedPrice(minPrice, event.tickets[0].currency, t) : t('event.free')}
               </p>
            </div>
            {event.showRemainingCapacity && (
              <div className="text-right space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">{t('event.spotsLeft', { count: '' }).replace('spots left', '').trim()}</p>
                <div className="flex items-center gap-1.5 font-black text-lg">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {event.capacityRemaining}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * 3. SEASON ONE HIGHLIGHT
 */
function SeasonOneSection() {
  const { t, language } = useLanguage();
  const isRTL = language === 'fa';

  const stats = [
    { label: t('home.seasonOne.stats.events'), value: '24+', icon: Calendar },
    { label: t('home.seasonOne.stats.participants'), value: '800+', icon: Users },
    { label: t('home.seasonOne.stats.hours'), value: '1,200', icon: Quote },
    { label: t('home.seasonOne.stats.photos'), value: '5K+', icon: Camera },
  ];

  return (
    <section id="season-one" className="py-24 md:py-40 bg-secondary/5 relative overflow-hidden">
      <div className="container max-w-screen-2xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="space-y-4">
              <Badge variant="secondary" className="text-primary bg-primary/10 border-none px-4 py-1.5 rounded-full font-bold">
                {t('home.hero.secondaryCTA')}
              </Badge>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                {t('home.seasonOne.title')}
              </h2>
              <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-xl">
                {t('home.seasonOne.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="p-6 rounded-[2rem] bg-background border border-border/50 shadow-sm hover:shadow-md transition-all">
                  <stat.icon className="h-6 w-6 text-primary mb-3" />
                  <p className="text-3xl font-black text-foreground mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

            <Button size="lg" className="rounded-full h-14 px-8 font-bold group">
              {t('home.seasonOne.cta')}
              <ArrowRight className={cn("ml-2 h-5 w-5 transition-transform group-hover:translate-x-1", isRTL && "rotate-180")} />
            </Button>
          </div>

          <div className="relative aspect-video rounded-[3rem] overflow-hidden shadow-2xl group animate-in zoom-in-95 duration-1000">
             <Image 
                src="https://images.unsplash.com/photo-1475721027785-f74ec0f77995?q=80&w=2069&auto=format&fit=crop"
                alt="Season One Recap"
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
             />
             <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors duration-500" />
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-2xl transform transition-all duration-500 group-hover:scale-110 cursor-pointer">
                  <Play className="h-10 w-10 fill-current ml-1" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 4. WHY THINK THEN TALK
 */
function WhySection() {
  const { t } = useLanguage();
  const features = [
    { id: 'speaking', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'friends', icon: Sparkles, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { id: 'safe', icon: ShieldCheck, color: 'text-green-500', bg: 'bg-green-50' },
    { id: 'critical', icon: Lightbulb, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'games', icon: Trophy, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'noJudgment', icon: CheckCircle2, color: 'text-teal-500', bg: 'bg-teal-50' },
  ];

  return (
    <section className="py-24 md:py-32">
      <div className="container max-w-screen-2xl">
        <div className="mb-16 md:mb-24 text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">{t('home.why.title')}</h2>
          <p className="text-xl text-muted-foreground font-light">{t('home.why.subtitle')}</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((f) => (
            <Card key={f.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-500 group rounded-[2rem] bg-card/50 overflow-hidden">
               <CardHeader>
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3", f.bg)}>
                    <f.icon className={cn("h-7 w-7", f.color)} />
                  </div>
                  <CardTitle className="text-2xl font-bold">{t(`home.why.${f.id}.title`)}</CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {t(`home.why.${f.id}.desc`)}
                  </p>
               </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * 5. COMMUNITY GALLERY
 * Visual showcase of real atmosphere.
 */
function GallerySection() {
  const { t } = useLanguage();
  
  const items = [
    { url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=2070&auto=format&fit=crop', span: 'col-span-2 row-span-2' },
    { url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop', span: 'col-span-1 row-span-1' },
    { url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2064&auto=format&fit=crop', span: 'col-span-1 row-span-2' },
    { url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop', span: 'col-span-1 row-span-1' },
    { url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=1949&auto=format&fit=crop', span: 'col-span-2 row-span-1' },
  ];

  return (
    <section className="py-24 md:py-32 bg-secondary/10">
      <div className="container max-w-screen-2xl">
        <div className="mb-16 text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">{t('home.moments.title')}</h2>
          <p className="text-xl text-muted-foreground font-light">{t('home.moments.subtitle')}</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[200px] md:auto-rows-[300px]">
          {items.map((item, i) => (
            <div key={i} className={cn("relative rounded-[2rem] overflow-hidden shadow-lg group", item.span)}>
              <Image 
                src={item.url} 
                alt="Community Moment" 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-110" 
                loading="lazy"
              />
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * 6. SUGGEST AN EVENT
 */
function SuggestSection() {
  const { t, language } = useLanguage();
  const isRTL = language === 'fa';

  return (
    <section className="py-24 md:py-32">
      <div className="container max-w-screen-2xl">
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 rounded-[3rem] p-8 md:p-16 overflow-hidden relative shadow-2xl">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
          <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Lightbulb className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tight">{t('home.suggest.title')}</h2>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                  {t('home.suggest.subtitle')}
                </p>
              </div>
              <Button size="lg" className="h-14 px-10 rounded-full font-bold shadow-xl" asChild>
                <Link href="/ideas">{t('home.suggest.cta')}</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-4 pt-12">
                  <div className="aspect-square bg-background border rounded-3xl p-6 flex flex-col justify-between shadow-sm transform hover:-rotate-3 transition-all">
                    <PenTool className="h-8 w-8 text-primary/40" />
                    <p className="font-bold text-sm leading-tight">Design the flow of a thematic session.</p>
                  </div>
                  <div className="aspect-square bg-primary text-primary-foreground rounded-3xl p-6 flex flex-col justify-between shadow-xl transform hover:rotate-3 transition-all">
                    <Quote className="h-8 w-8 opacity-40" />
                    <p className="font-bold text-sm leading-tight">Pitch unique discussion prompts.</p>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="aspect-square bg-background border rounded-3xl p-6 flex flex-col justify-between shadow-sm transform hover:rotate-3 transition-all">
                    <MapPin className="h-8 w-8 text-primary/40" />
                    <p className="font-bold text-sm leading-tight">Propose hidden gems for venues.</p>
                  </div>
                  <div className="aspect-square bg-secondary text-secondary-foreground border rounded-3xl p-6 flex flex-col justify-between shadow-sm transform hover:-rotate-3 transition-all">
                    <Rocket className="h-8 w-8 opacity-40" />
                    <p className="font-bold text-sm leading-tight">Launch a new localized chapter.</p>
                  </div>
               </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

/**
 * 7. COLLABORATE WITH US
 */
function CollaborateSection() {
  const { t, language } = useLanguage();
  const isRTL = language === 'fa';
  
  const roles = [
    { icon: Users, label: 'Moderation' },
    { icon: Camera, label: 'Photography' },
    { icon: Video, label: 'Video Editing' },
    { icon: Mail, label: 'Ops & Support' },
  ];

  return (
    <section className="py-24 md:py-32 bg-foreground text-background rounded-[4rem] mx-4 md:mx-8 shadow-2xl">
      <div className="container max-w-screen-2xl">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative aspect-square">
             <Image 
                src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=1949&auto=format&fit=crop"
                alt="Collaboration Team"
                fill
                className="object-cover rounded-[3rem] opacity-80"
             />
             <div className="absolute inset-0 border-[16px] border-background/10 rounded-[3rem] -m-6 animate-pulse-slow" />
          </div>

          <div className="space-y-10">
            <div className="space-y-6">
              <Badge variant="outline" className="text-primary border-primary px-6 py-1.5 rounded-full font-bold uppercase tracking-widest">
                Curators Wanted
              </Badge>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                {t('home.collaborate.title')}
              </h2>
              <p className="text-xl opacity-70 font-light leading-relaxed">
                {t('home.collaborate.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {roles.map((role, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                  <role.icon className="h-6 w-6 text-primary" />
                  <span className="font-bold text-lg">{role.label}</span>
                </div>
              ))}
            </div>

            <Button size="lg" variant="secondary" className="rounded-full h-14 px-10 font-bold group" asChild>
               <Link href="/collaborate">
                {t('home.collaborate.cta')}
                <ArrowRight className={cn("ml-2 h-5 w-5 transition-transform group-hover:translate-x-1", isRTL && "rotate-180")} />
               </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 8. SPONSORSHIP
 */
function SponsorshipSection() {
  const { t } = useLanguage();
  const { data: sponsors, isLoading } = useSponsorsQuery();

  return (
    <section className="py-24 md:py-40">
      <div className="container max-w-screen-2xl">
        <div className="flex flex-col lg:flex-row gap-16 items-end justify-between mb-20">
          <div className="space-y-6 max-w-3xl">
             <h2 className="text-4xl md:text-5xl font-black tracking-tight">{t('home.sponsorship.title')}</h2>
             <p className="text-xl text-muted-foreground font-light leading-relaxed">
              {t('home.sponsorship.subtitle')}
             </p>
          </div>
          <Button size="lg" variant="outline" className="h-16 px-10 rounded-full border-2 font-black tracking-tight text-lg" asChild>
            <Link href="/sponsorship">{t('home.sponsorship.cta')}</Link>
          </Button>
        </div>

        <div className="pt-12 border-t">
          <p className="text-xs font-black uppercase text-muted-foreground tracking-[0.2em] mb-12 text-center">
            {t('home.sponsorship.logoTitle')}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 items-center opacity-40 hover:opacity-60 transition-opacity">
            {isLoading ? (
               Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : sponsors && sponsors.length > 0 ? (
              sponsors.map(s => (
                <div key={s.id} className="relative h-12 grayscale hover:grayscale-0 transition-all duration-500 cursor-pointer">
                  <Image src={s.logoUrl} alt={s.name} fill className="object-contain" />
                </div>
              ))
            ) : (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 border-2 border-dashed border-muted rounded-xl flex items-center justify-center">
                  <span className="text-[10px] font-bold text-muted-foreground">PARTNER {i+1}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 9. MEET THE TEAM
 */
function TeamSection() {
  const { t, language } = useLanguage();
  const { data: team, isLoading } = useTeamMembersQuery();

  return (
    <section className="py-24 md:py-32 bg-secondary/5 border-y border-border/40">
      <div className="container max-w-screen-2xl text-center">
        <div className="mb-20 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">{t('home.team.title')}</h2>
          <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">{t('home.team.subtitle')}</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4"><Skeleton className="h-48 w-48 rounded-full mx-auto" /><Skeleton className="h-4 w-32 mx-auto" /></div>
            ))
          ) : team?.map(member => (
            <div key={member.id} className="space-y-6 group">
              <div className="relative h-64 w-64 mx-auto rounded-[3rem] overflow-hidden shadow-xl transform transition-all duration-500 group-hover:-rotate-3 group-hover:scale-105">
                 <Image src={member.photoUrl} alt={member.name} fill className="object-cover" />
                 <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tight">{member.name}</h3>
                <p className="text-primary font-bold text-sm uppercase tracking-widest">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * 10. FINAL CTA
 */
function FinalCTASection() {
  const { t, language } = useLanguage();
  const isRTL = language === 'fa';

  return (
    <section className="py-32 md:py-48 text-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-40" />
      </div>
      
      <div className="container max-w-4xl relative z-10 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
          {t('home.final.title')}
        </h2>
        <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl mx-auto">
          {t('home.final.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
           <Button size="lg" className="h-16 px-12 rounded-full text-xl font-bold shadow-2xl group" asChild>
             <Link href="/login">
               {t('home.final.cta')}
               <ArrowRight className={cn("ml-2 h-6 w-6 transition-transform group-hover:translate-x-1", isRTL && "rotate-180")} />
             </Link>
           </Button>
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
      <SeasonOneSection />
      <WhySection />
      <GallerySection />
      <SuggestSection />
      <CollaborateSection />
      <SponsorshipSection />
      <TeamSection />
      <FinalCTASection />
    </div>
  );
}
