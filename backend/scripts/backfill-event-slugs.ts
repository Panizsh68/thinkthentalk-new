import { PrismaClient } from '@prisma/client';
import { buildEventSlug, slugify } from '../src/events/utils/slug.helper';
import { parseLocalizedText } from '../src/events/utils/localized-text.helper';

const prisma = new PrismaClient();

const normalizeSlug = (value: string, fallback: string) => {
  const trimmed = value.trim();
  return trimmed ? slugify(trimmed) : fallback;
};

const ensureUnique = (base: string, existing: Set<string>) => {
  let candidate = base;
  let suffix = 1;
  while (existing.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  existing.add(candidate);
  return candidate;
};

async function main() {
  const events = await prisma.event.findMany({
    select: { id: true, title: true, slug: true },
  });

  const used = new Set(
    events
      .map((event) => event.slug)
      .filter((slug): slug is string => Boolean(slug && slug.trim())),
  );

  for (const event of events) {
    if (event.slug && event.slug.trim()) {
      continue;
    }

    const localizedTitle = parseLocalizedText(event.title);
    const baseSlug = buildEventSlug(localizedTitle);
    const fallback = `event-${event.id.slice(0, 8)}`;
    const normalized = normalizeSlug(baseSlug, fallback);
    const uniqueSlug = ensureUnique(normalized, used);

    await prisma.event.update({
      where: { id: event.id },
      data: { slug: uniqueSlug },
    });
  }
}

main()
  .catch((error) => {
    console.error('Failed to backfill event slugs:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
