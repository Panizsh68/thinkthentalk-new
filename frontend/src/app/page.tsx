'use client';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-provider";
import { useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useEventsQuery } from "@/hooks/use-event-queries";
import { useTeamMembersQuery } from "@/hooks/use-team-queries";
import { useSponsorsQuery } from "@/hooks/use-sponsor-queries";
import { Skeleton } from "@/components/ui/skeleton";
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Users, ArrowRight, Quote, Sparkles, Calendar, MapPin, Play, CheckCircle2, Trophy, ShieldCheck, Camera, PenTool, Rocket } from "lucide-react";
import { getLocalizedTextValue } from "@/lib/i18n/get-localized-text";
import { formatEventDate, getEventPath, getMinPrice, getFormattedPrice } from "@/lib/event-helpers";
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

/**
 * 2. UPCOMING EVENTS
 */
function EventsSection() {
  const { t } = useLanguage();
  const { data: events, isLoading, error } = useEventsQuery({
    forHomepage: true,
    showPastEvents: false,
    limit: 3,
    sortBy: 'startDateTime',
    sortOrder: 'asc',
  });

  return (
    <section className="container max-w-screen-2xl py-20 md:py-28 border-b border-border/40 px-4">
        <div className="mb-12 md:mb-20 text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">{t('home.events.title')}</h2>
            <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto">{t('home.events.subtitle')}</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[400px] w-full rounded-[2rem]" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 rounded-3xl bg-destructive/5 text-center border border-destructive/10">
            <p className="text-destructive font-medium">{t('errors.fetchEvents')}</p>
          </div>
        ) : events?.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-[2rem] border-2 border-dashed">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg">{t('events.noEvents')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {events?.map((event, i) => (
              <ExperienceCard key={event.id} event={event} isFeatured={i === 0} />
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
            <Button size="lg" variant="ghost" className="rounded-full px-10 h-12 text-primary hover:bg-primary/5 font-bold" asChild>
                <Link href="/events">{t('home.events.viewAllButton')} <ArrowRight className="ml-2 h-4 w-4" /></Link>
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
        "h-full flex flex-col border-none shadow-md overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl rounded-[2rem] bg-card",
        isFeatured && "ring-1 ring-primary/10"
      )}>
        <div className="relative aspect-video overflow-hidden">
          {event.posterUrl ? (
            <Image 
              src={event.posterUrl} 
              alt={eventTitle} 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-secondary/50 flex items-center justify-center">
              <Sparkles className="h-12 w-12 text-primary/10" />
            </div>
          )}
          
          <div className="absolute top-4 left-4 z-10">
            <Badge variant="secondary" className="backdrop-blur-md bg-white/80 dark:bg-black/80 text-foreground">
              {event.type === 'ONLINE' ? t('event.online') : getLocalizedTextValue(event.city || {fa: '', en: ''}, language)}
            </Badge>
          </div>
        </div>
        <CardContent className="p-6 flex-grow space-y-3">
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
            <Calendar className="h-3.5 w-3.5" />
            {formattedDate}
          </div>
          <h3 className="text-xl font-bold tracking-tight line-clamp-1">{eventTitle}</h3>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
            {eventSummary}
          </p>
          
          <div className="pt-4 flex items-center justify-between border-t border-border/50">
            <div className="font-bold text-primary">
              {minPrice !== null ? getFormattedPrice(minPrice, event.tickets[0].currency, t) : t('event.free')}
            </div>
            {event.showRemainingCapacity && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <Users className="h-3.5 w-3.5" />
                {t('event.spotsLeft', { count: event.capacityRemaining })}
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

  const stats = [
    { label: t('home.seasonOne.stats.events'), value: '۲۰+', icon: Calendar },
    { label: t('home.seasonOne.stats.participants'), value: '۱۰۰+', icon: Users },
    { label: t('home.seasonOne.stats.photos'), value: '۳۰۰۰+', icon: Camera },
    { label: t('home.seasonOne.stats.hours'), value: '۴۰+', icon: Quote },
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
                <div key={i} className="p-5 rounded-3xl bg-background border border-border/50 shadow-sm">
                  <stat.icon className="h-5 w-5 text-primary mb-2" />
                  <p className="text-2xl font-black text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl group bg-black">
             <video 
                poster="/static-images/group-photo-2.jpg"
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                controls
                src="/static-images/2026-06-29 21.54.43.mp4"
             />
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:hidden transition-all">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-2xl">
                  <Play className="h-6 w-6 fill-current ml-1" />
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
    <section className="py-20 md:py-32 border-b border-border/40 px-4">
      <div className="container max-w-screen-2xl">
        <div className="mb-12 md:mb-20 text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">{t('home.why.title')}</h2>
          <p className="text-lg text-muted-foreground font-medium">{t('home.why.subtitle')}</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.id} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2rem] bg-card/50">
               <CardHeader>
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-2", f.bg)}>
                    <f.icon className={cn("h-6 w-6", f.color)} />
                  </div>
                  <CardTitle className="text-xl font-bold">{t(`home.why.${f.id}.title`)}</CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-muted-foreground leading-relaxed text-sm">
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
 */
function GallerySection() {
  const { t } = useLanguage();
  
  const items = [
    { url: '/static-images/group-photo-1.jpg', span: 'col-span-2 row-span-2' },
    { url: '/static-images/group-photo-2.jpg', span: 'col-span-1 row-span-1' },
    { url: '/static-images/group-photo-3.jpg', span: 'col-span-1 row-span-2' },
    { url: '/static-images/group-photo-4.jpg', span: 'col-span-1 row-span-1' },
    { url: '/static-images/group-photo-2.jpg', span: 'col-span-2 row-span-1' },
  ];

  return (
    <section className="py-20 md:py-32 bg-secondary/10 px-4">
      <div className="container max-w-screen-2xl">
        <div className="mb-12 text-center space-y-2">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">{t('home.moments.title')}</h2>
          <p className="text-lg text-muted-foreground font-medium">{t('home.moments.subtitle')}</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[150px] md:auto-rows-[250px]">
          {items.map((item, i) => (
            <div key={i} className={cn("relative rounded-3xl overflow-hidden shadow-sm group", item.span)}>
              <Image 
                src={item.url} 
                alt="Community Life" 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-105" 
                loading="lazy"
              />
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
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

/**
 * 7. COLLABORATE WITH US
 */
function CollaborateSection() {
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

/**
 * 8. SPONSORSHIP
 */
function SponsorshipSection() {
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

        {(!isLoading && sponsors && sponsors.length > 0) && (
          <div className="pt-10">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center opacity-40 grayscale transition-all hover:opacity-100 hover:grayscale-0">
              {sponsors.map(s => (
                  <div key={s.id} className="relative h-8">
                    <Image src={s.logoUrl} alt={s.name} fill className="object-contain" />
                  </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * 9. MEET THE TEAM
 */
function TeamSection() {
  const { t } = useLanguage();
  const { data: team, isLoading } = useTeamMembersQuery();

  if (!isLoading && (!team || team.length === 0)) return null;

  return (
    <section className="py-20 md:py-32 border-b border-border/40 px-4">
      <div className="container max-w-screen-2xl text-center">
        <div className="mb-16 space-y-2">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">{t('home.team.title')}</h2>
          <p className="text-lg text-muted-foreground font-medium max-w-xl mx-auto">{t('home.team.subtitle')}</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4"><Skeleton className="h-40 w-40 rounded-full mx-auto" /><Skeleton className="h-4 w-24 mx-auto" /></div>
            ))
          ) : team?.map(member => (
            <div key={member.id} className="space-y-4 group">
              <div className="relative h-48 w-48 mx-auto rounded-3xl overflow-hidden shadow-md transform transition-all group-hover:scale-105">
                 <Image src={member.photoUrl} alt={member.name} fill className="object-cover" />
                 <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{member.name}</h3>
                <p className="text-primary font-bold text-xs uppercase tracking-widest">{member.role}</p>
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