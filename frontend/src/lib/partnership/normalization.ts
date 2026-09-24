const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function normalizeDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = PERSIAN_DIGITS.indexOf(digit);
    if (persianIndex >= 0) return String(persianIndex);
    return String(ARABIC_DIGITS.indexOf(digit));
  });
}

export function normalizeIranianMobile(value: string): string {
  let normalized = normalizeDigits(value.trim()).replace(/[\s\-()]/g, '');
  if (normalized.startsWith('+98')) normalized = `0${normalized.slice(3)}`;
  if (normalized.startsWith('0098')) normalized = `0${normalized.slice(4)}`;
  if (normalized.startsWith('98')) normalized = `0${normalized.slice(2)}`;
  if (/^9\d{9}$/.test(normalized)) normalized = `0${normalized}`;
  return normalized;
}

export function trimOptional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}
