
import apiClient from './client';
import type { User } from '@/lib/types';

export async function getProfile(): Promise<User> {
  try {
    const { data: user } = await apiClient.get<User>('/users/me');
    return user;
  } catch (error) {
    throw new Error('Failed to fetch user profile. Please try logging in again.');
  }
}

export async function updateUserProfile(userData: Partial<Omit<User, 'id' | 'mobile'>>): Promise<User> {
  try {
    const { data: updatedUser } = await apiClient.patch<User>('/users/me', userData);
    return updatedUser;
  } catch (error: any) {
    if (error.status === 400) {
      throw new Error(error.message || 'Validation failed. Please check your input and try again.');
    }
    throw new Error('Failed to update user profile.');
  }
}
