
'use client';
import apiClient from './client';
import type { AdminStats } from '@/lib/types';

export async function getAdminStats(): Promise<AdminStats> {
  try {
    const { data } = await apiClient.get<AdminStats>('/admin/stats');
    return data;
  } catch (error: any) {
    console.error('Failed to fetch admin stats:', error);
    throw new Error(error.message || 'Failed to fetch dashboard statistics.');
  }
}
