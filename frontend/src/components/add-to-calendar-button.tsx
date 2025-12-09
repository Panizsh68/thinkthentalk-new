'use client';

import { CalendarPlus } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '@/lib/i18n/language-provider';
import { generateICS } from '@/lib/calendar';
import type { Event } from '@/lib/types';
import { getLocalizedTextValue } from '@/lib/i18n/get-localized-text';

interface AddToCalendarButtonProps {
  event: Event;
}

export function AddToCalendarButton({ event }: AddToCalendarButtonProps) {
  const { t, language } = useLanguage();
  const eventTitle = getLocalizedTextValue(event.title, language);

  const handleAddToCalendar = () => {
    const icsContent = generateICS(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${eventTitle}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="ghost" onClick={handleAddToCalendar} className="gap-2 px-0 hover:bg-transparent text-muted-foreground hover:text-foreground">
      <CalendarPlus className="h-5 w-5" />
      <span className="font-medium">{t('actions.addToCalendar')}</span>
    </Button>
  );
}
