
'use client';

import React, { useMemo } from 'react';
import { useEventQuery } from '@/hooks/use-event-queries';
import { useEventRatingQuery } from '@/hooks/use-evaluation-queries';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-provider';
import { Badge } from '@/components/ui/badge';
import { isEventPast, formatEventDate } from '@/lib/event-helpers';
import { Calendar, MapPin, Users, Lock, Download, FileText, ArrowLeft, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TicketSelector } from '@/components/ticket-selector';
import type { EventTicketConfig, EventResource, Event } from '@/lib/types';
import { AddToCalendarButton } from '@/components/add-to-calendar-button';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { useUserRegistrationsQuery } from '@/hooks/use-registration-queries';
import { cn } from '@/lib/utils';
import { getLocalizedTextValue } from '@/lib/i18n/get-localized-text';
import { renderParagraphs } from '@/lib/text/render-paragraphs';


export default function EventDetailPage() {
  const { t, language } = useLanguage();
  const routeParams = useParams<{ id: string }>();
  const eventId = routeParams.id;

  const { data: event, isLoading: isLoadingEvent, error, refetch } = useEventQuery(eventId);
  const { data: rating } = useEventRatingQuery(eventId);
  const { isAuthenticated, currentUser } = useAuth();
  const { data: registrations, isLoading: isLoadingRegistrations } = useUserRegistrationsQuery(currentUser?.id);

  const isRegistered = useMemo(() => {
    if (!registrations) return false;
    return registrations.some(reg => reg.eventId === eventId && reg.status === 'PAID');
  }, [registrations, eventId]);

  const [selectedTicket, setSelectedTicket] = React.useState<EventTicketConfig | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = () => {
    if (!selectedTicket) {
       toast({
        variant: 'destructive',
        title: t('errors.genericTitle'),
        description: "Please select a ticket first."
      });
      return;
    }

    const registrationUrl = `/events/${eventId}/register?ticketType=${selectedTicket.type}`;

    if (isAuthenticated) {
      router.push(registrationUrl);
    } else {
      router.push(`/login?redirect=${encodeURIComponent(registrationUrl)}`);
    }
  };

  const isLoading = isLoadingEvent || (isAuthenticated && isLoadingRegistrations);

  if (isLoading) {
    return (
      <div className="container max-w-screen-2xl py-12">
        <Skeleton className="h-64 w-full mb-8" />
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <div className="md:col-span-2 space-y-6">
                <Skeleton className="h-12 w-3/4 mb-4" />
                <Skeleton className="h-6 w-1/2 mb-6" />
                 <Separator />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
            <div className="md:col-span-1">
                <Card>
                    <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                    <CardContent><Skeleton className="h-32 w-full" /></CardContent>
                    <CardFooter><Skeleton className="h-12 w-full" /></CardFooter>
                </Card>
            </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-20 text-center" data-testid="event-page-error">
        <p className="text-destructive mb-4">{t('errors.fetchEvent')}</p>
        <Button onClick={() => refetch()} variant="outline">
          {t('actions.retry')}
        </Button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container py-20 text-center" data-testid="event-not-found">
        <p className="text-xl mb-4">{t('errors.eventNotFound')}</p>
        <Button asChild>
            <Link href="/events">
                <ArrowLeft />
                {t('actions.backToEvents')}
            </Link>
        </Button>
      </div>
    );
  }

  const past = isEventPast(event);
  const hasResources = event.resources && event.resources.length > 0;

  const formattedDate = formatEventDate(event, language);
  const eventTitle = getLocalizedTextValue(event.title, language);
  const eventSummary = getLocalizedTextValue(event.summary, language, event.summary.en);
  const eventDescription = getLocalizedTextValue(event.description, language, event.description.en);
  const cityLabel = event.city ? getLocalizedTextValue(event.city, language) : t('event.cityUnknown');
  const summaryParagraphs = renderParagraphs(eventSummary);
  const descriptionParagraphs = renderParagraphs(eventDescription);
  const ratingValue = rating?.average ? rating.average.toFixed(1) : null;

  return (
    <>
      {event.posterUrl ? (
        <div className="relative h-64 md:h-96 w-full">
            <Image 
                src={event.posterUrl}
                alt={`${eventTitle} poster`}
                fill
                className="object-cover"
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>
      ) : (
        <div className="h-24 bg-muted" />
      )}
      <div className={cn("container max-w-screen-2xl pb-8 md:pb-12", !event.posterUrl && "pt-8 md:pt-12")}>
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6 -mt-16 md:-mt-24 relative z-10">
            <header className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <h1 className="text-h1">{eventTitle}</h1>
                    <Badge variant={past ? 'secondary' : 'default'} className="hidden sm:inline-flex">
                        {past ? t('event.finished') : t('event.upcoming')}
                    </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-x-6 gap-y-4 text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        <span className="font-medium">
                            {formattedDate}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        {ratingValue ? (
                          <span className="font-medium">
                            {ratingValue} / 5 ({rating?.count ?? 0})
                          </span>
                        ) : (
                          <span className="text-sm">{t('event.noRatings')}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        <span className="font-medium">
                            {event.type === 'ONLINE' ? t('event.online') : `${t('event.offline')} - ${cityLabel}`}
                        </span>
                    </div>
                    <AddToCalendarButton event={event} />
                </div>
                <Badge variant={past ? 'secondary' : 'default'} className="sm:hidden">
                    {past ? t('event.finished') : t('event.upcoming')}
                </Badge>
            </header>

            <Separator />
            
            <div className="space-y-4">
                <div className="text-muted-foreground summary space-y-3">
                  {summaryParagraphs ?? (
                    <p className="event-paragraph">{eventSummary}</p>
                  )}
                </div>
                {descriptionParagraphs && (
                  <div className="text-foreground description space-y-4">
                    {descriptionParagraphs}
                  </div>
                )}
            </div>
            
            {hasResources && (
                <>
                <Separator />
                <section className="space-y-4">
                    <h2 className="text-h3">{t('event.resourcesTitle')}</h2>
                    <div className="space-y-4">
                    {event.resources.map(resource => (
                        <ResourceItem key={resource.id} resource={resource} isRegistered={isRegistered} />
                    ))}
                    </div>
                </section>
                </>
            )}

            </div>

            {/* Side Panel */}
            <div className="md:col-span-1">
            <Card className="sticky top-24">
                <CardHeader>
                <CardTitle>{t('event.tickets')}</CardTitle>
                <CardDescription>
                    {past ? t('event.eventHasFinished') : t('event.selectTicket')}
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <TicketSelector 
                        tickets={event.tickets} 
                        selectedTicket={selectedTicket}
                        onTicketSelect={setSelectedTicket}
                        disabled={past}
                    />
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                            {event.showRemainingCapacity ? t('event.spotsLeft', { count: event.capacityRemaining }) : t('event.limitedSeats')}
                        </span>
                    </div>
                </CardContent>
                <CardFooter>
                <Button 
                    size="lg" 
                    className="w-full"
                    onClick={handleRegister}
                    disabled={!selectedTicket || past || isRegistered}
                    data-testid="register-button"
                >
                    {isRegistered ? t('event.alreadyRegistered') : past ? t('event.finished') : t('actions.register')}
                </Button>
                </CardFooter>
            </Card>
            </div>

        </div>
      </div>
    </>
  );
}

function ResourceItem({ resource, isRegistered }: { resource: EventResource; isRegistered: boolean }) {
  const { t, language } = useLanguage();
  const canAccess = resource.accessLevel === 'PUBLIC' || isRegistered;
  const resourceTitle = typeof resource.title === 'string' ? resource.title : resource.title[language] || resource.title.en;

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
      <div className="flex items-start gap-4">
         <FileText className="h-6 w-6 flex-shrink-0 text-primary mt-1" />
         <div>
            <h3 className="font-semibold">{resourceTitle}</h3>
            <p className="text-sm text-muted-foreground">{resource.description}</p>
            <Badge variant="outline" className="mt-2 text-xs">
                {resource.accessLevel === 'PUBLIC' ? t('event.resourcePublic') : t('event.resourceRegisteredOnly')}
            </Badge>
         </div>
      </div>
      
      {canAccess ? (
         <Button variant="outline" size="sm" asChild>
            <a href={resource.url} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                {t('actions.download')}
            </a>
         </Button>
      ) : (
         <div className="flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Lock className="h-5 w-5"/>
            <span className="text-xs max-w-[100px]">{t('event.resourceAvailableAfterRegistration')}</span>
         </div>
      )}
    </div>
  )
}
