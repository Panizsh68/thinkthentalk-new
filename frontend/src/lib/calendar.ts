import type { Event } from './types';

const getDefaultLocalizedValue = (text?: Record<'fa' | 'en', string>, fallback = ''): string => {
  if (!text) return fallback;
  const enValue = (text.en ?? '').trim();
  if (enValue.length > 0) {
    return enValue;
  }
  const faValue = (text.fa ?? '').trim();
  return faValue.length > 0 ? faValue : fallback;
};

/**
 * Formats a Date object into a UTC string for ICS files (YYYYMMDDTHHmmssZ).
 * @param date The date to format.
 * @returns The formatted UTC date string.
 */
const formatICSDate = (date: Date): string => {
  return date.toISOString().replace(/[-:.]/g, '').slice(0, -4) + 'Z';
};

/**
 * Generates an ICS file content string for a given event.
 * @param event The event object.
 * @returns A string representing the content of an .ics file.
 */
export const generateICS = (event: Event): string => {
  const startDate = new Date(event.startDateTime);
  // Default to 2 hours if no end time is specified.
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); 

  const title = getDefaultLocalizedValue(event.title);
  const summary = getDefaultLocalizedValue(event.summary);

  const icsData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ThinkThenTalk//EventCalendar//EN',
    'BEGIN:VEVENT',
    `DTSTAMP:${formatICSDate(new Date())}`,
    `UID:${event.id}@thinkthentalk.com`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${summary}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
  ];

  if (event.type === 'OFFLINE' && event.address) {
    const cityLabel = event.city ? getDefaultLocalizedValue(event.city) : '';
    const location = cityLabel ? `${event.address}, ${cityLabel}` : event.address;
    icsData.push(`LOCATION:${location}`);
  } else if (event.type === 'ONLINE') {
    // In a real app, you'd put the event link here.
    icsData.push('LOCATION:Online Event');
  }

  icsData.push('END:VEVENT', 'END:VCALENDAR');

  return icsData.join('\r\n');
};
