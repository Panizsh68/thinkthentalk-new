import apiClient from './client';
import type { Event, EventTicketConfig, EventResource } from '@/lib/types/event';

export interface GetEventsParams {
  dateRange?: { from?: Date; to?: Date };
  type?: 'ONLINE' | 'OFFLINE';
  categories?: string[];
  category?: string;
  city?: string;
  showPastEvents?: boolean;
  limit?: number;
  sortBy?: 'startDateTime' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  forHomepage?: boolean;
}

const transformEvent = (event: any): Event => {
  const eventStart = new Date(event.startDateTime);
  const eventEnd = event.endDateTime ? new Date(event.endDateTime) : undefined;

  return {
    id: event.id,
    slug: event.slug ?? event.id,
    title: event.title,
    summary: event.summary,
    description: event.description,
    startDateTime: eventStart,
    endDateTime: eventEnd,
    city: event.city,
    address: event.address,
    type: event.type,
    posterUrl: event.posterUrl,
    categories: event.categories || [],
    capacityTotal: event.capacityTotal,
    capacityRemaining: event.capacityRemaining,
    showRemainingCapacity: event.showRemainingCapacity,
    tickets: (event.tickets || []).map((t: any) => ({
      ...t,
      saleStartDate: t.saleStartDate ? new Date(t.saleStartDate) : eventStart,
      saleEndDate: t.saleEndDate
        ? new Date(t.saleEndDate)
        : eventEnd ?? new Date(eventStart.getTime() + 30 * 24 * 60 * 60 * 1000),
      earlyBirdEndDate: t.earlyBirdEndDate ? new Date(t.earlyBirdEndDate) : undefined,
      quantityRemaining:
        typeof t.quantityRemaining === 'number'
          ? t.quantityRemaining
          : Math.max((t.quantityTotal ?? 0) - (t.quantitySold ?? 0), 0),
    })) as EventTicketConfig[],
    resources: event.resources as EventResource[],
    publicDiscountIds: event.publicDiscountIds || [],
    isArchived: Boolean(event.isArchived),
    archivedAt: event.archivedAt ? new Date(event.archivedAt) : undefined,
    archivedById: event.archivedById ?? null,
    deletedAt: event.deletedAt ? new Date(event.deletedAt) : undefined,
    deletedById: event.deletedById ?? null,
  };
};


export async function getEvents(params: GetEventsParams = {}): Promise<Event[]> {
  const queryParams = new URLSearchParams();

  if (typeof params.showPastEvents === 'boolean') {
    queryParams.append('showPastEvents', String(params.showPastEvents));
  }
  const normalizedType = typeof params.type === 'string' ? params.type.toUpperCase() : undefined;
  if (normalizedType && normalizedType !== 'ALL') {
    queryParams.append('type', normalizedType);
  }
  const normalizedCity = typeof params.city === 'string' ? params.city.trim() : undefined;
  if (normalizedCity && normalizedCity.toLowerCase() !== 'all') {
    queryParams.append('city', normalizedCity);
  }
  const normalizedCategory = typeof params.category === 'string' ? params.category.trim() : undefined;
  if (normalizedCategory && normalizedCategory.toLowerCase() !== 'all') {
    queryParams.append('category', normalizedCategory);
  }
  const normalizedCategories = Array.isArray(params.categories)
    ? params.categories
      .flatMap((category) => category.split(','))
      .map((category) => category.trim())
      .filter((category) => category.length > 0 && category.toLowerCase() !== 'all')
    : [];
  normalizedCategories.forEach((category) => queryParams.append('categories[]', category));
  if (params.dateRange?.from) {
    queryParams.append('dateRange[from]', params.dateRange.from.toISOString());
  }
  if (params.dateRange?.to) {
    queryParams.append('dateRange[to]', params.dateRange.to.toISOString());
  }
  if (params.limit) {
    queryParams.append('limit', String(params.limit));
  }
  if (params.sortBy) {
    queryParams.append('sortBy', params.sortBy);
  }
  if (params.sortOrder) {
    queryParams.append('sortOrder', params.sortOrder);
  }
  if (params.forHomepage) {
    queryParams.append('forHomepage', 'true');
  }

  const { data } = await apiClient.get<any[]>(`/events?${queryParams.toString()}`);
  return data.map(transformEvent);
}

export async function getEventById(id: string): Promise<Event | null> {
  try {
    const { data } = await apiClient.get<any>(`/events/${id}`);
    if (!data) return null;
    return transformEvent(data);
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    console.error(`Failed to fetch event with id ${id}:`, error);
    throw error;
  }
}
