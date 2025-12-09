export interface LocalizedText {
  fa: string;
  en: string;
}

export const emptyLocalizedText = (): LocalizedText => ({ fa: '', en: '' });

export function parseLocalizedText(
  value?: string | null,
  fallbackFa = '',
  fallbackEn = '',
): LocalizedText {
  if (!value) {
    const fallbackValue = fallbackFa ?? '';
    return {
      fa: fallbackValue,
      en: fallbackEn || fallbackValue,
    };
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed.fa === 'string' && typeof parsed.en === 'string') {
      return {
        fa: parsed.fa,
        en: parsed.en,
      };
    }
  } catch (error) {
    // Fall through to legacy fallback
  }

  return {
    fa: value,
    en: fallbackEn || value,
  };
}

export function serializeLocalizedText(text: LocalizedText): string {
  return JSON.stringify({
    fa: text.fa,
    en: text.en,
  });
}

export function fromLegacyLocalizedText(
  fa?: string | null,
  en?: string | null,
): LocalizedText {
  const fallbackFa = fa ?? '';
  const fallbackEn = en ?? '';
  return {
    fa: fallbackFa,
    en: fallbackEn.length > 0 ? fallbackEn : fallbackFa,
  };
}
