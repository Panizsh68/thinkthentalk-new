'use client';
import apiClient from './client';
import type {
  AdminUserDetails,
  AdminUserListItem,
  AdminUsersQuery,
  AdminUserRegistrationSummary,
} from '@/lib/types';

const toDate = (value: any): Date | undefined => {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
};

const transformRegistration = (reg: any): AdminUserRegistrationSummary => ({
  ...reg,
  eventStartDateTime: toDate(reg.eventStartDateTime),
  createdAt: toDate(reg.createdAt)!,
  formData: reg.formData,
});

const transformProfile = (profile: any) => ({
  ...profile,
});

export async function getAdminUsers(filters: AdminUsersQuery = {}): Promise<AdminUserListItem[]> {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.profileStatus) params.append('profileStatus', filters.profileStatus);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));

  const queryString = params.toString();
  const { data } = await apiClient.get<AdminUserListItem[]>(
    `/admin/users${queryString ? `?${queryString}` : ''}`,
  );

  return data.map((item: any) => ({
    ...transformProfile(item),
    createdAt: toDate(item.createdAt)!,
    lastRegistrationAt: toDate(item.lastRegistrationAt) ?? null,
  }));
}

export async function getAdminUser(userId: string): Promise<AdminUserDetails | null> {
  const { data } = await apiClient.get<AdminUserDetails>(`/admin/users/${userId}`);
  if (!data) return null;

  return {
    profile: transformProfile((data as any).profile),
    registrations: (data as any).registrations?.map(transformRegistration) ?? [],
  };
}
