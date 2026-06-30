'use client';
import Link from 'next/link';
import { Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EventCard } from "@/components/event-card";
import { useLanguage } from "@/lib/i18n/language-provider";
import { useEventsQuery } from "@/hooks/use-event-queries";

export function EventsSection() {
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
              <EventCard key={event.id} event={event} />
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
