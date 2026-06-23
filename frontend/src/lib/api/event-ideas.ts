
import apiClient from './client';
import type { EventIdea, CreateEventIdeaDto, PaginatedEventIdeas, EventIdeaStatus, EventIdeaType } from '../types';

export async function submitEventIdea(dto: CreateEventIdeaDto): Promise<EventIdea> {
  const { data } = await apiClient.post<EventIdea>('/event-ideas', dto);
  return data;
}

export async function getAdminEventIdeas(params: {
  status?: EventIdeaStatus;
  type?: EventIdeaType;
  page?: number;
  limit?: number;
}): Promise<PaginatedEventIdeas> {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.type) query.append('type', params.type);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const { data } = await apiClient.get<PaginatedEventIdeas>(`/event-ideas/admin?${query.toString()}`);
  return data;
}

export async function updateIdeaStatus(id: string, status: EventIdeaStatus): Promise<EventIdea> {
  const { data } = await apiClient.patch<EventIdea>(`/event-ideas/admin/${id}/status`, { status });
  return data;
}

export async function deleteEventIdea(id: string): Promise<void> {
  await apiClient.delete(`/event-ideas/admin/${id}`);
}
