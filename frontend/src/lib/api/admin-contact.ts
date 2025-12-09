'use client';
import apiClient from './client';
import type { ContactMessage, PaginatedContactMessages, ContactMessageStatus } from '@/lib/types';

export interface ContactMessagesQuery {
  status?: ContactMessageStatus | 'all';
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

const transformContactMessage = (payload: any): ContactMessage => ({
  id: payload.id,
  name: payload.name ?? null,
  email: payload.email,
  message: payload.message,
  source: payload.source,
  ipAddress: payload.ipAddress ?? null,
  userAgent: payload.userAgent ?? null,
  language: payload.language ?? 'en',
  status: payload.status,
  processedAt: payload.processedAt ?? null,
  emailSent: Boolean(payload.emailSent),
  createdAt: payload.createdAt,
  updatedAt: payload.updatedAt,
});

export async function getContactMessages(query: ContactMessagesQuery): Promise<PaginatedContactMessages> {
  const params = new URLSearchParams();
  if (query.status && query.status !== 'all') params.append('status', query.status);
  if (query.search) params.append('search', query.search.trim());
  if (query.startDate) params.append('startDate', query.startDate);
  if (query.endDate) params.append('endDate', query.endDate);
  params.append('page', String(query.page ?? 1));
  params.append('pageSize', String(query.pageSize ?? 20));

  const queryString = params.toString();
  const path = queryString ? `/admin/contact?${queryString}` : '/admin/contact';
  const { data } = await apiClient.get<PaginatedContactMessages>(path);
  return {
    ...data,
    items: (data.items || []).map(transformContactMessage),
  };
}

export async function getContactMessage(id: string): Promise<ContactMessage> {
  const { data } = await apiClient.get<ContactMessage>(`/admin/contact/${id}`);
  return transformContactMessage(data);
}

export async function updateContactMessageStatus(id: string, status: ContactMessageStatus): Promise<ContactMessage> {
  const { data } = await apiClient.patch<ContactMessage>(`/admin/contact/${id}`, { status });
  return transformContactMessage(data);
}

export async function archiveContactMessage(id: string): Promise<ContactMessage> {
  const { data } = await apiClient.delete<ContactMessage>(`/admin/contact/${id}`);
  return transformContactMessage(data);
}
