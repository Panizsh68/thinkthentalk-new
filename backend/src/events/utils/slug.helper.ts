export const slugify = (value: string): string => {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const collapsed = normalized
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');

  return collapsed || 'event';
};

export const buildEventSlug = (title: { fa: string; en?: string | null }) =>
  slugify(title.en?.trim() || title.fa?.trim() || '');
