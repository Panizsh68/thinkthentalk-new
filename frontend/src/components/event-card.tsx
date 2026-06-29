'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Ticket, Users, Image as ImageIcon, Sparkles } from 'lucide-react';

import type { Event } from '@/lib/types';
import { useLanguage } from '@/lib/i18n/language-provider';
import { cn } from '@/lib/utils';
import { getFormattedPrice, getMinPrice, isEventPast, formatEventDate, getEventPath } from '@/lib/event-helpers';
import { getLocalizedTextValue } from '@/lib/i18n/get-localized-text';
import { renderParagraphs } from '@/lib/text/render-paragraphs';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const { language, t } = useLanguage();
  const isRTL = language === 'fa';
  const past = isEventPast(event);
  const minPrice = getMinPrice(event.tickets);

  const dateTimeLabel = formatEventDate(event, language);
  const cityLabel = event.city
    ? getLocalizedTextValue(event.city, language)
    : t('event.cityUnknown');
  const locationLabel = event.type === 'ONLINE'
    ? t('event.online')
    : `${t('event.offline')} - ${cityLabel}`;
  const title = getLocalizedTextValue(event.title, language);
  const summary = getLocalizedTextValue(event.summary, language, event.summary.en);
  
  const summaryParagraphs =
    renderParagraphs(summary, 'event-paragraph text-sm text-muted-foreground line-clamp-2') ||
    null;

  return (
    <Link href={getEventPath(event)} className="group h-full block">
      <Card className="flex h-full flex-col border-none shadow-lg overflow-hidden transition-all duration-700 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 rounded-[2rem] bg-card" data-testid={`event-card-${event.id}`}>
        <div className="aspect-video relative overflow-hidden">
          {event.posterUrl ? (
            <Image 
              src={event.posterUrl} 
              alt={title} 
              fill 
              className="object-cover transition-transform duration-1000 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-secondary/50 flex items-center justify-center">
              <Sparkles className="h-12 w-12 text-primary/10" />
            </div>
          )}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Badge variant={past ? 'secondary' : 'default'} className="backdrop-blur-md bg-white/70 dark:bg-black/70 text-foreground border-none">
              {past ? t('event.finished') : t('event.upcoming')}
            </Badge>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
        </div>

        <CardHeader className="space-y-4 p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{dateTimeLabel}</span>
            </div>
            <CardTitle className="text-xl font-black leading-tight group-hover:text-primary transition-colors">{title}</CardTitle>
          </div>
          <div className="space-y-2">
            {summaryParagraphs ?? (
              <p className="text-sm text-muted-foreground line-clamp-2">{summary}</p>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-grow p-6 pt-0 space-y-4">
          <div className="flex flex-wrap gap-4 text-xs font-bold text-muted-foreground/80">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {locationLabel}
            </div>
            {event.showRemainingCapacity && event.capacityRemaining > 0 && (
              <div className="flex items-center gap-1.5 text-accent-foreground">
                <Users className="h-3.5 w-3.5" />
                {t('event.spotsLeft', { count: event.capacityRemaining })}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-primary" />
              <span className="font-black text-lg">
                {minPrice !== null ? getFormattedPrice(minPrice, event.tickets[0].currency, t) : t('event.free')}
              </span>
            </div>
            <div className="flex items-center text-primary font-bold text-sm gap-1 transition-all group-hover:gap-2">
               {t('event.viewDetails')}
               <ArrowRight className={cn("h-4 w-4", isRTL && "rotate-180")} />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ArrowRight(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
  );
}
