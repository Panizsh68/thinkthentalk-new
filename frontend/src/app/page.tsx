'use client';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-provider";
import { useAuth } from "@/lib/auth/auth-provider";
import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useEventsQuery } from "@/hooks/use-event-queries";
import { EventCard } from "@/components/event-card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from 'next/link';
import type { Sponsor, TeamMember } from "@/lib/types";
import { useSponsorsQuery } from "@/hooks/use-sponsor-queries";
import { useTeamMembersQuery } from "@/hooks/use-team-queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lightbulb, Users, HeartHandshake, ArrowRight, Quote, Sparkles, MessageCircle } from "lucide-react";

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
    <section className="relative h-[85vh] min-h-[600px] w-full flex items-center justify-center text-center text-white overflow-hidden">
      {PlaceHolderImages.map((image, index) => (
        <Image
          key={image.id}
          src={image.imageUrl}
          alt={image.description}
          fill
          className={cn(
            "object-cover transition-opacity duration-[2000ms] ease-in-out scale-105",
            index === currentImageIndex ? "opacity-100" : "opacity-0"
          )}
          data-ai-hint={image.imageHint}
          priority={index === 0}
        />
      ))}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-all duration-1000" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

      <div className="relative z-10 container flex max-w-[64rem] flex-col items-center gap-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <Badge variant="outline" className="text-white border-white/20 bg-white/10 backdrop-blur-md px-4 py-1 mb-2">
          {t('home.hero.kicker')}
        </Badge>
        <h1 className="text-h1 sm:text-6xl text-white tracking-tight drop-shadow-sm">
          {t('home.hero.title')}
        </h1>
        <p className="max-w-[42rem] leading-relaxed sm:text-2xl text-slate-200 font-light opacity-90">
          {t('home.hero.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-primary/20 transition-all" onClick={() => router.push('/events')}>
            {t('home.hero.browseButton')}
            <ArrowRight className="ml-2 h-5 w-5 rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function ExperienceSection() {
  const { t, language } = useLanguage();
  const isRTL = language === 'fa';

  return (
    <section className="py-24 bg-background">
      <div className="container max-w-screen-2xl">
        <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-16 items-center", isRTL && "text-right")}>
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-h2 text-primary flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-accent" />
                {t('home.experience.title')}
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed font-light">
                {t('home.experience.subtitle')}
              </p>
            </div>
            
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl border border-border/50 bg-secondary/10">
                  <div className="mt-1">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{t(`home.experience.perk${i}.title`)}</h3>
                    <p className="text-muted-foreground">{t(`home.experience.perk${i}.desc`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
             <div className="absolute -inset-4 bg-primary/10 rounded-full blur-3xl opacity-50" />
             <Card className="relative border-none bg-secondary/20 backdrop-blur-sm overflow-hidden p-8 shadow-inner">
                <Quote className="h-12 w-12 text-primary/20 mb-4" />
                <p className="text-2xl font-serif italic text-foreground/80 leading-relaxed mb-6">
                  {t('home.experience.simulation.quote')}
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-1 bg-primary rounded-full" />
                  <span className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">
                    {t('home.experience.simulation.caption')}
                  </span>
                </div>
             </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

function InteractionSection() {
  const { t, language } = useLanguage();
  const isRTL = language === 'fa';

  const cards = [
    {
      title: t('nav.ideas'),
      description: t('ideas.subtitle'),
      icon: Lightbulb,
      href: '/ideas',
      color: 'text-yellow-500',
      bg: 'bg-yellow-50 dark:bg-yellow-500/10'
    },
    {
      title: t('nav.collaborate'),
      description: t('collaborate.subtitle'),
      icon: Users,
      href: '/collaborate',
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-500/10'
    },
    {
      title: t('nav.sponsorship'),
      description: t('sponsorship.subtitle'),
      icon: HeartHandshake,
      href: '/sponsorship',
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-500/10'
    }
  ];

  return (
    <section className="bg-secondary/30 py-24">
      <div className="container max-w-screen-2xl">
        <div className="text-center mb-16">
          <h2 className="text-h2 mb-4">{t('home.interaction.title')}</h2>
          <p className="text-xl text-muted-foreground">{t('home.interaction.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card) => (
            <Card key={card.href} className="group hover:shadow-2xl transition-all duration-500 border-none bg-background/60 backdrop-blur-sm overflow-hidden">
              <CardHeader>
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm transition-transform group-hover:scale-110", card.bg)}>
                  <card.icon className={cn("h-7 w-7", card.color)} />
                </div>
                <CardTitle className="text-2xl">{card.title}</CardTitle>
                <CardDescription className="line-clamp-3 text-base leading-relaxed">
                  {card.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" asChild className="p-0 hover:bg-transparent group/btn">
                  <Link href={card.href} className="flex items-center gap-2 text-primary font-bold">
                    {t('actions.view')}
                    <ArrowRight className={cn("h-4 w-4 transition-transform", isRTL ? "group-hover:-translate-x-2 rotate-180" : "group-hover:translate-x-2")} />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function EventsSection() {
  const { t, language } = useLanguage();
  const { data: events, isLoading, error } = useEventsQuery({
    forHomepage: true,
    showPastEvents: true,
    limit: 3,
    sortBy: 'startDateTime',
    sortOrder: 'asc',
  });
  const eventsToShow = useMemo(() => events || [], [events]);

  return (
    <section className="container max-w-screen-2xl py-24">
        <div className="mb-16 text-center">
            <h2 className="text-h2 mb-4 tracking-tight">{t('home.events.title')}</h2>
            <p className="text-xl text-muted-foreground font-light">{t('home.events.subtitle')}</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-4">
                <Skeleton className="h-[250px] w-full rounded-2xl" />
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-destructive text-center py-10">{t('errors.fetchEvents')}</p>
        ) : eventsToShow.length === 0 ? (
          <p className="text-muted-foreground text-center py-20 bg-secondary/10 rounded-3xl">{t('events.noEvents')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {eventsToShow.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
            <Button size="lg" variant="outline" className="rounded-full px-10 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all" asChild>
                <Link href="/events">{t('home.events.viewAllButton')}</Link>
            </Button>
        </div>
    </section>
  );
}

function TrustSection() {
  const { t, language } = useLanguage();
  const isRTL = language === 'fa';

  const testimonials = [
    { name: t('home.trust.t1.name'), role: t('home.trust.t1.role'), text: t('home.trust.t1.text') },
    { name: t('home.trust.t2.name'), role: t('home.trust.t2.role'), text: t('home.trust.t2.text') },
    { name: t('home.trust.t3.name'), role: t('home.trust.t3.role'), text: t('home.trust.t3.text') },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container max-w-screen-2xl">
        <div className="text-center mb-16 space-y-4">
          <Badge className="bg-accent/10 text-accent hover:bg-accent/10 border-none px-4 py-1">
            {t('home.trust.kicker')}
          </Badge>
          <h2 className="text-h2 tracking-tight">{t('home.trust.title')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, i) => (
            <Card key={i} className="bg-secondary/5 border-none shadow-sm relative overflow-hidden group">
              <CardHeader>
                <div className="flex items-center gap-4 mb-2">
                  <Avatar className="h-12 w-12 border-2 border-primary/10">
                    <AvatarFallback className="bg-primary/5 text-primary">{item.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription>{item.role}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80 italic leading-relaxed">
                  "{item.text}"
                </p>
              </CardContent>
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <MessageCircle className="h-16 w-16" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function SponsorsSection() {
    const { t } = useLanguage();
    const { data: sponsors, isLoading } = useSponsorsQuery();
    
    if (isLoading || !sponsors || sponsors.length === 0) return null;

    return (
        <section className="bg-secondary/20 py-20">
            <div className="container max-w-screen-2xl">
                <div className="mb-12 text-center opacity-60">
                    <p className="text-sm font-semibold uppercase tracking-widest">{t('home.sponsors.subtitle')}</p>
                </div>
                <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24">
                  {sponsors.map((sponsor) => (
                      <div key={sponsor.id} className="relative h-12 w-32 md:h-16 md:w-40 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                          <Image
                              src={sponsor.logoUrl}
                              alt={sponsor.name}
                              fill
                              className="object-contain"
                          />
                      </div>
                  ))}
                </div>
            </div>
        </section>
    )
}

function TeamSection() {
    const { t } = useLanguage();
    const { data: team, isLoading } = useTeamMembersQuery();
    
    if (isLoading || !team || team.length === 0) return null;

    return (
        <section className="py-24 bg-background">
            <div className="container max-w-screen-2xl">
                 <div className="mb-16 text-center">
                    <h2 className="text-h2 tracking-tight">{t('home.team.title')}</h2>
                    <p className="mt-2 text-xl text-muted-foreground font-light">{t('home.team.subtitle')}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12">
                     {team.map((member) => (
                        <div key={member.id} className="text-center group">
                          <div className="relative inline-block mb-6">
                            <div className="absolute -inset-2 bg-gradient-to-tr from-primary to-accent rounded-full opacity-0 group-hover:opacity-20 transition-opacity" />
                            <Avatar className="h-32 w-32 mx-auto border-4 border-background shadow-xl ring-1 ring-border transition-transform duration-500 group-hover:scale-105">
                                <AvatarImage src={member.photoUrl} alt={member.name} />
                                <AvatarFallback className="text-2xl bg-secondary">{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          </div>
                          <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">{member.role}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function CheckCircle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  );
}

function Badge({ children, className, variant = "default" }: { children: React.ReactNode, className?: string, variant?: "default" | "outline" }) {
  return (
    <div className={cn(
      "inline-flex items-center rounded-full text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      variant === "default" && "bg-primary text-primary-foreground",
      variant === "outline" && "text-foreground border border-input",
      className
    )}>
      {children}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="flex flex-col gap-0">
      <HeroSection />
      <ExperienceSection />
      <EventsSection />
      <InteractionSection />
      <TrustSection />
      <SponsorsSection />
      <TeamSection />
    </div>
  );
}
