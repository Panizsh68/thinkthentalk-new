import { format as formatGregorian } from 'date-fns';
import { format as formatJalali } from 'date-fns-jalali';
import type { Language } from './types';

export function formatLocalizedDate(
  value: string | Date | null | undefined,
  language: Language,
  includeTime = false,
): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  if (language === 'fa') {
    return formatJalali(date, includeTime ? 'yyyy/MM/dd HH:mm' : 'yyyy/MM/dd');
  }

  return formatGregorian(date, includeTime ? 'MMM d, yyyy HH:mm' : 'MMM d, yyyy');
}
