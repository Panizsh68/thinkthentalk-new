/* eslint-disable prettier/prettier */
import { formatInTimeZone } from 'date-fns-tz';
import { enUS, faIR } from 'date-fns/locale';

// A function that formats a date for an event card, supporting both English and Persian languages.
export const formatEventDateTimeForCard = (
  date: Date | string,
  language: 'fa' | 'en'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const timeZone = 'Asia/Tehran';

  if (language === 'fa') {
    const customFaIR = {
      ...faIR,
      localize: {
        ...faIR.localize,
        day: (n: number) => ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'][n],
        month: (n: number) => ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'][n],
      },
    };

    const day = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arab', { day: 'numeric' }).format(dateObj);
    const month = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arab', { month: 'long' }).format(dateObj);
    const year = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arab', { year: 'numeric' }).format(dateObj).split(' ')[0];
    const weekday = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arab', { weekday: 'long' }).format(dateObj);
    const time = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arab', { hour: '2-digit', minute: '2-digit', hour12: false }).format(dateObj);
    
    return `${weekday} ${day} ${month} ${year} · ${time}`;
  }

  const formatStyle = "EEE, MMMM d, yyyy '·' h:mm a";
  return formatInTimeZone(dateObj, timeZone, formatStyle, { locale: enUS });
};
