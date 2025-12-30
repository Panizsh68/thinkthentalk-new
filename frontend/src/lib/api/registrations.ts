import type { UserRegistration } from '@/lib/types';
import apiClient from './client';


const transformRegistration = (reg: any): UserRegistration => ({
    ...reg,
    createdAt: new Date(reg.createdAt),
    event: {
        ...reg.event,
        startDateTime: new Date(reg.event.startDateTime)
    }
})

export async function getUserRegistrations(userId: string): Promise<UserRegistration[]> {
  try {
    const { data } = await apiClient.get<any[]>(`/registrations/me`);
    return data.map(transformRegistration);
  } catch (error: any) {
    console.error('Failed to fetch user registrations:', error);
    throw new Error(error.message || 'Failed to fetch registrations.');
  }
}
