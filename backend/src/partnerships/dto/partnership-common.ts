import { Transform } from 'class-transformer';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function trimText(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export function trimOptionalText(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeDigits(value: string): string {
  return value
    .split('')
    .map((digit) => {
      const persianIndex = PERSIAN_DIGITS.indexOf(digit);
      if (persianIndex >= 0) return String(persianIndex);
      const arabicIndex = ARABIC_DIGITS.indexOf(digit);
      return arabicIndex >= 0 ? String(arabicIndex) : digit;
    })
    .join('');
}

export function normalizeIranianPhone(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  let normalized = normalizeDigits(value.trim()).replace(/[\s\-()]/g, '');
  if (normalized.startsWith('+98')) normalized = `0${normalized.slice(3)}`;
  if (normalized.startsWith('0098')) normalized = `0${normalized.slice(4)}`;
  if (normalized.startsWith('98')) normalized = `0${normalized.slice(2)}`;
  if (/^9\d{9}$/.test(normalized)) normalized = `0${normalized}`;
  return normalized;
}

export const TrimText = () => Transform(({ value }) => trimText(value));
export const TrimOptionalText = () =>
  Transform(({ value }) => trimOptionalText(value));
export const NormalizeIranianPhone = () =>
  Transform(({ value }) => normalizeIranianPhone(value));
