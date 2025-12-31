import type { LocalizedText, Language } from '@/lib/types';

export function getLocalizedTextValue(
  text: LocalizedText | null | undefined,
  language: Language,
  fallback = '',
): string {
  if (!text) {
    return fallback;
  }

  const primary = (text[language] ?? '').trim();
  if (primary.length > 0) {
    return primary;
  }

  const secondaryKey: Language = language === 'fa' ? 'en' : 'fa';
  const secondary = (text[secondaryKey] ?? '').trim();
  return secondary.length > 0 ? secondary : fallback;
}
