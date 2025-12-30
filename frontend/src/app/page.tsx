
'use client';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-provider";
import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useEventsQuery } from "@/hooks/use-event-queries";
import { EventCard } from "@/components/event-card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from 'next/link';
import type { Event, Sponsor, TeamMember } from "@/lib/types";
import { useSponsorsQuery } from "@/hooks/use-sponsor-queries";
import { useTeamMembersQuery } from "@/hooks/use-team-queries";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


function HeroSection() {
  const { t } = useLanguage();
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === PlaceHolderImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-[60vh] min-h-[400px] w-full flex items-center justify-center text-center text-white overflow-hidden">
      {/* Background Slideshow */}
      {PlaceHolderImages.map((image, index) => (
        <Image
          key={image.id}
          src={image.imageUrl}
          alt={image.description}
          fill
          className={cn(
            "object-cover transition-opacity duration-1000 ease-in-out",
            index === currentImageIndex ? "opacity-100" : "opacity-0"
          )}
          priority={index === 0}
        />
      ))}
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Centered Content */}
      <div className="relative z-10 container flex max-w-[64rem] flex-col items-center gap-4 text-center">
        <h1 className="text-h1 text-white">{t('home.hero.title')}</h1>
        <p className="max-w-[42rem] leading-normal sm:text-xl sm:leading-8 text-slate-200">
          {t('home.hero.subtitle')}
        </p>
        <div className="flex gap-4 mt-4">
          <Button size="lg" onClick={() => router.push('/events')}>{t('home.hero.browseButton')}</Button>
          <Button size="lg" variant="secondary" onClick={() => router.push('/login')}>{t('home.hero.signupButton')}</Button>
        </div>
      </div>
    </section>
  );
}

function EventsSection() {
  const { t } = useLanguage();
  const { data: events, isLoading, error } = useEventsQuery({ forHomepage: true });
  const eventsToShow = useMemo(() => events?.slice(0, 3) || [], [events]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[225px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return <p className="text-destructive text-center">{t('errors.fetchEvents')}</p>;
    }

    if (!eventsToShow || eventsToShow.length === 0) {
      return <p className="text-muted-foreground text-center py-8">{t('events.noEvents')}</p>;
    }
    
    return (
       <>
        {/* Mobile Carousel */}
        <div className="md:hidden overflow-x-auto pb-4">
            <div className="flex gap-4">
                {eventsToShow.map((event) => (
                    <div key={event.id} className="w-[80%] sm:w-[60%] shrink-0">
                        <EventCard event={event} />
                    </div>
                ))}
            </div>
        </div>
        
        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
           {eventsToShow.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
        </div>
      </>
    );
  };

  return (
    <section className="container max-w-screen-2xl py-16">
        <div className="mb-12 text-center">
            <h2 className="text-h2">{t('home.events.title')}</h2>
            <p className="mt-2 text-xl text-muted-foreground">{t('home.events.subtitle')}</p>
        </div>

        {renderContent()}

        <div className="mt-12 text-center">
            <Button size="lg" asChild>
                <Link href="/events">{t('home.events.viewAllButton')}</Link>
            </Button>
        </div>
    </section>
  );
}

function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
    const cardContent = (
        <Card className="group relative flex h-full flex-col items-center justify-center p-6 text-center transition-all duration-300 hover:shadow-lg hover:scale-105">
            <div className="relative mb-4 h-24 w-24">
                <Image
                    src={sponsor.logoUrl}
                    alt={`${sponsor.name} logo`}
                    fill
                    className="object-contain"
                />
            </div>
            <h3 className="text-lg font-semibold">{sponsor.name}</h3>
            <p className="text-sm text-muted-foreground">{sponsor.productOrTagline}</p>
        </Card>
    );

    if (sponsor.websiteUrl) {
        return (
            <a href={sponsor.websiteUrl} target="_blank" rel="noopener noreferrer" className="h-full block">
                {cardContent}
            </a>
        );
    }
    return cardContent;
}

function SponsorsSection() {
    const { t } = useLanguage();
    const { data: sponsors, isLoading, error } = useSponsorsQuery();
    
    const renderContent = () => {
        if (isLoading) {
             return (
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <Skeleton className="h-24 w-24 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    ))}
                </div>
            );
        }
        if (error) {
            return <p className="text-destructive text-center">{t('errors.genericTitle')}</p>;
        }
        if (!sponsors || sponsors.length === 0) {
            return <p className="text-center text-muted-foreground">{t('home.sponsors.noSponsors')}</p>
        }

        return (
            <>
              {/* Mobile Carousel */}
              <div className="md:hidden overflow-x-auto pb-4">
                  <div className="flex gap-4">
                    {sponsors.map((sponsor) => (
                        <div key={sponsor.id} className="w-[60%] sm:w-[40%] shrink-0">
                            <SponsorCard sponsor={sponsor} />
                        </div>
                    ))}
                  </div>
              </div>

              {/* Desktop Grid */}
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
                {sponsors.map((sponsor) => (
                   <div key={sponsor.id} className="h-full">
                     <SponsorCard sponsor={sponsor} />
                   </div>
                ))}
              </div>
            </>
        )
    }

    return (
        <section className="bg-muted py-16">
            <div className="container max-w-screen-2xl">
                 <div className="mb-12 text-center">
                    <h2 className="text-h2">{t('home.sponsors.title')}</h2>
                    <p className="mt-2 text-xl text-muted-foreground">{t('home.sponsors.subtitle')}</p>
                </div>
                {renderContent()}
            </div>
        </section>
    )
}

function TeamMemberCard({ member }: { member: TeamMember }) {
    return (
        <div className="text-center">
            <Avatar className="h-32 w-32 mx-auto mb-4 border-4 border-background shadow-md">
                <AvatarImage src={member.photoUrl} alt={member.name} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-bold">{member.name}</h3>
            <p className="text-muted-foreground">{member.role}</p>
        </div>
    );
}

function TeamSection() {
    const { t } = useLanguage();
    const { data: team, isLoading, error } = useTeamMembersQuery();
    
    const renderContent = () => {
        if (isLoading) {
             return (
                <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <Skeleton className="h-32 w-32 rounded-full" />
                            <Skeleton className="h-4 w-24 mt-4" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    ))}
                </div>
            );
        }
        if (error) {
             return <p className="text-destructive text-center">{t('errors.genericTitle')}</p>
        }
        if (!team || team.length === 0) {
            return <p className="text-center text-muted-foreground">{t('home.team.noMembers')}</p>
        }

        return (
            <>
                {/* Mobile Carousel */}
                <div className="md:hidden overflow-x-auto pb-4">
                    <div className="flex gap-4">
                        {team.map((member) => (
                            <div key={member.id} className="w-[50%] sm:w-[40%] shrink-0">
                               <TeamMemberCard member={member} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Desktop Grid */}
                <div className="hidden md:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
                     {team.map((member) => (
                        <TeamMemberCard key={member.id} member={member} />
                    ))}
                </div>
            </>
        )
    }

    return (
        <section className="py-16">
            <div className="container max-w-screen-2xl">
                 <div className="mb-12 text-center">
                    <h2 className="text-h2">{t('home.team.title')}</h2>
                    <p className="mt-2 text-xl text-muted-foreground">{t('home.team.subtitle')}</p>
                </div>
                {renderContent()}
            </div>
        </section>
    )
}


export default function HomePage() {
  return (
    <>
      <HeroSection />
      <EventsSection />
      <SponsorsSection />
      <TeamSection />
    </>
  );
}
