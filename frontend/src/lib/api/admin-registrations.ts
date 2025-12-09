
'use client';

import apiClient from './client';
import type { UserRegistrationDetails, UpdateRegistrationAdminDto, AdminRegistrationsQueryDto } from '@/lib/types';

const transformDetails = (reg: any): UserRegistrationDetails => ({
  ...reg,
  createdAt: new Date(reg.createdAt),
  user: reg.user,
  formData: reg.formData,
  event: {
    ...reg.event,
    startDateTime: new Date(reg.event.startDateTime),
  },
  payment: {
    ...reg.payment,
    amount: Number(reg.payment.amount),
  }
});


export async function getAllRegistrations(filters: AdminRegistrationsQueryDto): Promise<UserRegistrationDetails[]> {
  const params = new URLSearchParams();
  if (filters.eventId) params.append('eventId', filters.eventId);
  if (filters.status) params.append('status', filters.status);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));
  
  try {
    const { data } = await apiClient.get<any[]>(`/admin/registrations?${params.toString()}`);
    return data.map(transformDetails);
  } catch (error: any) {
    console.error("Failed to fetch all registrations:", error);
    throw new Error(error.message || "Failed to fetch registrations.");
  }
}

export async function getRegistrationById(registrationId: string): Promise<UserRegistrationDetails | null> {
  try {
    const { data } = await apiClient.get<any>(`/admin/registrations/${registrationId}`);
    return data ? transformDetails(data) : null;
  } catch (error: any) {
     if (error.status === 404) return null;
     console.error(`Failed to fetch registration ${registrationId}:`, error);
     throw new Error(error.message || "Failed to fetch registration details.");
  }
}

export async function updateRegistration(
  registrationId: string,
  updates: UpdateRegistrationAdminDto
): Promise<UserRegistrationDetails> {
  try {
    const { data } = await apiClient.patch<any>(`/admin/registrations/${registrationId}`, updates);
    return transformDetails(data);
  } catch (error: any) {
    console.error(`Failed to update registration ${registrationId}:`, error);
    throw new Error(error.message || "Failed to update registration.");
  }
}
