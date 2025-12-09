
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Ticket, Users, Image as ImageIcon } from 'lucide-react';

import type { Event } from '@/lib/types';
import { useLanguage } from '@/lib/i18n/language-provider';
import { cn } from '@/lib/utils';
import { getFormattedPrice, getMinPrice, isEventPast, formatEventDate } from '@/lib/event-helpers';
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
  const description = getLocalizedTextValue(event.description, language, event.description.en);
  const summaryParagraphs =
    renderParagraphs(summary, 'event-paragraph text-sm text-muted-foreground') ||
    null;
  const descriptionParagraphs =
    renderParagraphs(
      description,
      'event-paragraph text-xs text-muted-foreground/80',
    ) || null;

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lg" data-testid={`event-card-${event.id}`}>
        {event.posterUrl ? (
            <div className="aspect-video relative overflow-hidden">
                <Image 
                    src={event.posterUrl} 
                    alt={title} 
                    fill 
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
            </div>
        ) : (
            <div className="aspect-video bg-muted flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
            </div>
        )}
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-h4 leading-tight">{title}</CardTitle>
          <Badge variant={past ? 'secondary' : 'default'}>
            {past ? t('event.finished') : t('event.upcoming')}
          </Badge>
        </div>
        <div className="space-y-2">
          {summaryParagraphs ?? (
            <p className="text-sm text-muted-foreground">{summary}</p>
          )}
        </div>
        {descriptionParagraphs && (
          <div className="text-xs text-muted-foreground/80 max-h-24 overflow-hidden">
            {descriptionParagraphs}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {dateTimeLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            {locationLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
                {event.showRemainingCapacity ? t('event.spotsLeft', { count: event.capacityRemaining }) : t('event.limitedSeats')}
            </span>
        </div>
        {minPrice !== null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Ticket className="h-4 w-4" />
                <span>{getFormattedPrice(minPrice, event.tickets[0].currency, t)}</span>
            </div>
        )}

      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" data-testid={`event-details-link-${event.id}`}>
          <Link href={`/events/${event.id}`}>{t('event.viewDetails')}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
