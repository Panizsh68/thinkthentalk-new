import type { Event, EventTicketConfig, Language } from './types';
import { formatInTimeZone } from 'date-fns-tz';
import { enUS } from 'date-fns/locale';
import faIR from 'date-fns-jalali/locale/fa-IR';
import { format as formatJalali } from 'date-fns-jalali';

type MinimalEvent = Pick<Event, 'startDateTime' | 'endDateTime'>;
const TIME_ZONE = 'Asia/Tehran';
const toPersianDigits = (numStr: string) =>
  numStr.replace(/[0-9]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 1728));

export const isEventPast = (event: MinimalEvent): boolean => {
  const now = new Date();
  const eventEnd = event.endDateTime
    ? new Date(event.endDateTime)
    : new Date(new Date(event.startDateTime).getTime() + 2 * 60 * 60 * 1000);
  return eventEnd < now;
};


export const getMinPrice = (tickets: EventTicketConfig[]): number | null => {
  if (!tickets || tickets.length === 0) {
    return null;
  }
  const min = Math.min(...tickets.map(t => t.price));
  return min;
};

export const getFormattedPrice = (
  price: number,
  currency: string,
  t: (key: string) => string
): string => {
  if (price === 0) {
    return t('event.free');
  }
  const translatedCurrency = currency === 'TOMAN' ? t('admin.currency.TOMAN') : currency;
  const formattedPrice = new Intl.NumberFormat(t('lng')).format(price);
  return `${formattedPrice} ${translatedCurrency}`;
};

export const getFormattedDateTime = (
  date: Date | string,
  language: Language
): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (language === 'fa') {
        const day = formatJalali(dateObj, 'd', { locale: faIR });
        const month = formatJalali(dateObj, 'MMMM', { locale: faIR });
        const year = formatJalali(dateObj, 'yyyy', { locale: faIR });
        const weekday = formatJalali(dateObj, 'eeee', { locale: faIR });
        const time = formatInTimeZone(dateObj, TIME_ZONE, 'HH:mm', { locale: faIR });

        return `${weekday} ${toPersianDigits(day)} ${month} ${toPersianDigits(year)}، ساعت ${toPersianDigits(time)}`;
    }

    const formatStyle = "EEEE, MMMM d, yyyy '@' h:mm a";
    return formatInTimeZone(dateObj, TIME_ZONE, formatStyle, { locale: enUS });
};

export const formatEventDateTimeForCard = (
  date: Date | string,
  language: Language
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (language === 'fa') {
    const day = formatJalali(dateObj, 'd', { locale: faIR });
    const month = formatJalali(dateObj, 'MMMM', { locale: faIR });
    const year = formatJalali(dateObj, 'yyyy', { locale: faIR });
    const weekday = formatJalali(dateObj, 'eeee', { locale: faIR });
    const time = formatInTimeZone(dateObj, TIME_ZONE, 'HH:mm', { locale: faIR });

    return `${weekday} ${toPersianDigits(day)} ${month} ${toPersianDigits(year)} · ${toPersianDigits(time)}`;
  }

  const formatStyle = "EEE, MMMM d, yyyy '·' h:mm a";
  return formatInTimeZone(dateObj, TIME_ZONE, formatStyle, { locale: enUS });
};

const formatDateFa = (date: Date, includeTime: boolean) => {
  const day = formatJalali(date, 'd', { locale: faIR });
  const month = formatJalali(date, 'MMMM', { locale: faIR });
  const year = formatJalali(date, 'yyyy', { locale: faIR });
  const weekday = formatJalali(date, 'eeee', { locale: faIR });
  const dateLabel = `${weekday} ${toPersianDigits(day)} ${month} ${toPersianDigits(year)}`;
  if (!includeTime) {
    return dateLabel;
  }
  const time = formatInTimeZone(date, TIME_ZONE, 'HH:mm', { locale: faIR });
  return `${dateLabel} · ${toPersianDigits(time)}`;
};

const formatTimeFa = (date: Date) =>
  toPersianDigits(formatInTimeZone(date, TIME_ZONE, 'HH:mm', { locale: faIR }));

const formatDateEn = (date: Date, includeTime: boolean) => {
  const datePart = formatInTimeZone(date, TIME_ZONE, 'EEEE, MMMM d, yyyy', { locale: enUS });
  if (!includeTime) {
    return datePart;
  }
  const time = formatInTimeZone(date, TIME_ZONE, 'h:mm a', { locale: enUS });
  return `${datePart} · ${time}`;
};

const formatTimeEn = (date: Date) =>
  formatInTimeZone(date, TIME_ZONE, 'h:mm a', { locale: enUS });

export const formatEventDate = (event: MinimalEvent, language: Language): string => {
  const start = new Date(event.startDateTime);
  const hasEnd = event.endDateTime ? new Date(event.endDateTime) : null;

  const formatDate = language === 'fa' ? formatDateFa : formatDateEn;
  const formatTime = language === 'fa' ? formatTimeFa : formatTimeEn;

  if (!hasEnd || start.getTime() === hasEnd.getTime()) {
    return formatDate(start, true);
  }

  const sameDay =
    hasEnd &&
    start.getFullYear() === hasEnd.getFullYear() &&
    start.getMonth() === hasEnd.getMonth() &&
    start.getDate() === hasEnd.getDate();

  if (sameDay) {
    return `${formatDate(start, false)} · ${formatTime(start)} — ${formatTime(hasEnd)}`;
  }

  return `${formatDate(start, true)} — ${formatDate(hasEnd, true)}`;
};

export const getRegistrationWizardUrl = (eventId: string, ticketType: string, step: number): string => {
    return `/events/${eventId}/register?ticketType=${ticketType}&step=${step}`;
}
