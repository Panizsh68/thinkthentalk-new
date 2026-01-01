
'use client';
import apiClient from './client';
import type { Event, EventFormData, UpdateEventFormDataDto, EventTicketConfig, EventResource } from '@/lib/types';

export interface GetAdminEventsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: 'upcoming' | 'past' | 'all';
  type?: 'ONLINE' | 'OFFLINE';
  archived?: 'all' | 'true' | 'false';
  deleted?: 'all' | 'true' | 'false';
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
    resources: event.resources,
    publicDiscountIds: event.publicDiscountIds,
    isArchived: Boolean(event.isArchived),
    archivedAt: event.archivedAt ? new Date(event.archivedAt) : undefined,
    archivedById: event.archivedById ?? null,
    deletedAt: event.deletedAt ? new Date(event.deletedAt) : undefined,
    deletedById: event.deletedById ?? null,
  };
};

export async function getAdminEvents(params: GetAdminEventsParams = {}): Promise<Event[]> {
  const queryParams = new URLSearchParams();

  if (params.page) {
    queryParams.append('page', String(params.page));
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
  if (params.status) {
    queryParams.append('status', params.status);
  }
  if (params.type) {
    queryParams.append('type', params.type);
  }
  if (params.archived) {
    queryParams.append('archived', params.archived);
  }
  if (params.deleted) {
    queryParams.append('deleted', params.deleted);
  }

  try {
    const { data } = await apiClient.get<any[]>(`/admin/events?${queryParams.toString()}`);
    return Array.isArray(data) ? data.map(transformEvent) : [];
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      throw new Error('You are not authorized to view this page.');
    }
    throw error;
  }
}

export async function getAdminEventById(id: string): Promise<Event | null> {
  try {
    const { data } = await apiClient.get<any>(`/admin/events/${id}`);
    if (!data) return null;
    return transformEvent(data);
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    console.error(`Failed to fetch admin event with id ${id}:`, error);
    throw error;
  }
}

export async function createEvent(eventData: EventFormData): Promise<Event> {
  try {
    const { data } = await apiClient.post<any>('/admin/events', eventData);
    return transformEvent(data);
  } catch (error: any) {
    console.error('Failed to create event:', error);
    throw new Error(error.message || 'Failed to create event');
  }
}


export async function updateEvent(id: string, eventData: UpdateEventFormDataDto): Promise<Event> {
  try {
    const { data } = await apiClient.patch<any>(`/admin/events/${id}`, eventData);
    return transformEvent(data);
  } catch (error: any) {
    console.error(`Failed to update event ${id}:`, error);
    throw new Error(error.message || 'Failed to update event');
  }
}

export async function updateEventTickets(eventId: string, tickets: EventTicketConfig[]): Promise<Event> {
  try {
    const payload = tickets.map((ticket) => ({
      ...ticket,
      saleStartDate: ticket.saleStartDate?.toISOString?.() ?? ticket.saleStartDate,
      saleEndDate: ticket.saleEndDate?.toISOString?.() ?? ticket.saleEndDate,
      earlyBirdEndDate: ticket.earlyBirdEndDate
        ? ticket.earlyBirdEndDate.toISOString?.() ?? ticket.earlyBirdEndDate
        : null,
    }));
    const { data } = await apiClient.patch<any>(`/admin/events/${eventId}/tickets`, payload);
    return transformEvent(data);
  } catch (error: any) {
    console.error(`Failed to update tickets for event ${eventId}:`, error);
    throw new Error(error.message || 'Failed to update tickets');
  }
}

export async function updateEventResources(eventId: string, resources: Partial<EventResource>[]): Promise<Event> {
    try {
        const { data } = await apiClient.patch<any>(`/admin/events/${eventId}/resources`, resources);
        return transformEvent(data);
    } catch (error: any) {
        console.error(`Failed to update resources for event ${eventId}:`, error);
        throw new Error(error.message || 'Failed to update resources');
    }
}

export async function archiveEvent(eventId: string, archived: boolean): Promise<Event> {
  try {
    const { data } = await apiClient.patch<any>(`/admin/events/${eventId}/archive`, { archived });
    return transformEvent(data);
  } catch (error: any) {
    console.error(`Failed to archive event ${eventId}:`, error);
    throw new Error(error.message || 'Failed to archive event');
  }
}

export async function deleteEvent(eventId: string, options: { force?: boolean } = {}): Promise<Event> {
  try {
    const params = new URLSearchParams();
    if (options.force) {
      params.append('force', 'true');
    }
    const headers = options.force ? { 'X-Confirm-Delete': 'true' } : undefined;
    const queryString = params.toString();
    const url = queryString ? `/admin/events/${eventId}?${queryString}` : `/admin/events/${eventId}`;
    const { data } = await apiClient.delete<any>(url, { headers });
    return transformEvent(data);
  } catch (error: any) {
    console.error(`Failed to delete event ${eventId}:`, error);
    throw new Error(error.message || 'Failed to delete event');
  }
}
