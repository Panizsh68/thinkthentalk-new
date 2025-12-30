
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { EventCard } from '@/components/event-card';
import { EventsFilterBar, type EventFilters, type CityFilterOption } from '@/components/events-filter-bar';
import { useEventsQuery } from '@/hooks/use-event-queries';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { EventCategory, Event, LocalizedText } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { isEventPast } from '@/lib/event-helpers';
import { getLocalizedTextValue } from '@/lib/i18n/get-localized-text';

const getUniqueCategories = (events: Event[]): string[] => {
  const allValues = events.flatMap((event) => Array.isArray(event.categories) ? event.categories : []);
  return [...new Set(allValues.filter(Boolean))];
};

const serializeCityValue = (city: LocalizedText): string => JSON.stringify({ fa: city.fa, en: city.en });

const initialFilters: EventFilters = {
  showPastEvents: false,
  type: 'ALL',
  city: 'all',
  categories: [],
};

export default function EventsPage() {
  const { t, language } = useLanguage();
  const [filters, setFilters] = useState<EventFilters>(initialFilters);

  // Always fetch all events (including past) to enable robust client-side filtering.
  const { data: allEvents, isLoading, error, refetch } = useEventsQuery({
    showPastEvents: true,
    sortBy: 'startDateTime',
    sortOrder: 'desc',
  });

  const sortedEvents = useMemo(() => {
    if (!allEvents) return [];
    return [...allEvents].sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime());
  }, [allEvents]);

  const isFilterActive = useMemo(() => {
    return (
      filters.city !== 'all' ||
      filters.type !== 'ALL' ||
      (filters.categories && filters.categories.length > 0) ||
      filters.showPastEvents !== initialFilters.showPastEvents
    );
  }, [filters]);

  const filteredEvents = useMemo(() => {
    if (!sortedEvents) return [];
    return sortedEvents.filter(event => {
      if (filters.city && filters.city !== 'all') {
        if (!event.city) return false;
        if (serializeCityValue(event.city) !== filters.city) return false;
      }
      if (filters.type && filters.type !== 'ALL' && event.type !== filters.type) return false;
      if (filters.categories && filters.categories.length > 0) {
        const eventCats = Array.isArray(event.categories) ? event.categories : [];
        if (!filters.categories.every(cat => eventCats.includes(cat))) return false;
      }
      if (!filters.showPastEvents && isEventPast(event)) {
        return false;
      }
      return true;
    });
  }, [sortedEvents, filters]);
  
  const eventsToShow = isFilterActive ? filteredEvents : sortedEvents.slice(0, 3);

  const cities = useMemo<CityFilterOption[]>(() => {
    if (!allEvents) return [];
    const seen = new Set<string>();
    const options: CityFilterOption[] = [];
    allEvents.forEach((event) => {
      if (!event.city) return;
      const value = serializeCityValue(event.city);
      if (seen.has(value)) return;
      seen.add(value);
      options.push({
        value,
        label: getLocalizedTextValue(event.city, language),
      });
    });
    return options;
  }, [allEvents, language]);

  const categories = useMemo(() => getUniqueCategories(allEvents || []) as EventCategory[], [allEvents]);

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  return (
    <div className="container max-w-screen-2xl">
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-16">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <h1 className="text-h1">{t('events.title')}</h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            {t('events.subtitle')}
          </p>
        </div>

        <EventsFilterBar
          filters={filters}
          onFilterChange={setFilters}
          cities={cities}
          categories={categories}
          isLoading={isLoading}
        />

        {error && (
          <div className="text-center text-destructive py-8">
            <p>{t('errors.fetchEvents')}</p>
            <Button onClick={() => refetch()} variant="outline" className="mt-4">
              {t('actions.retry')}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                    <Skeleton className="h-[225px] w-full rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                </div>
              ))
            : eventsToShow.map((event) => <EventCard key={event.id} event={event} />)}
        </div>

        {!isLoading && !error && eventsToShow.length === 0 && (
            <div className="text-center text-muted-foreground py-8 space-y-4">
                <p>{t('events.noEventsFound')}</p>
                <Button variant="outline" onClick={handleClearFilters}>{t('actions.clearFilters')}</Button>
            </div>
        )}

      </section>
    </div>
  );
}
