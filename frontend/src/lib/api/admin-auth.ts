
import apiClient from './client';
import type { AdminUser } from '@/lib/types';

interface AdminAuthResponse {
  user: AdminUser;
}

export async function login(email: string, password: string): Promise<{ user: AdminUser, token: string }> {
  try {
    const { data, token } = await apiClient.post<AdminAuthResponse>('/auth/admin/login', { email, password });
    if (!token) {
      throw new Error('Authentication failed: No admin token provided.');
    }
    return { user: data.user, token };
  } catch (error: any) {
    throw new Error(error.message || 'Login failed. Please check your credentials and try again.');
  }
}
