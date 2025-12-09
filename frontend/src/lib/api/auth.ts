import apiClient from './client';
import type { User } from '@/lib/types';

export async function requestOtp(mobile: string): Promise<{ success: true }> {
  try {
    await apiClient.post('/auth/request-otp', { mobile });
    return { success: true };
  } catch (error: any) {
    if (error.status === 429) {
      throw new Error('Too many requests. Please try again later.');
    }
    if (error.status === 400) {
      throw new Error(error.message || 'Invalid mobile number.');
    }
    throw error;
  }
}

export async function verifyOtp(mobile: string, otp: string): Promise<{ user: User; token: string }> {
  try {
    const { data, token } = await apiClient.post<{ user: User }>('/auth/verify-otp', { mobile, otp });

    if (!token) {
      throw new Error('Authentication failed: No token provided.');
    }

    return { user: data.user, token };
  } catch (error: any) {
    if (error.status === 400) {
      throw new Error(error.message || 'Invalid data provided. Please check the mobile number and OTP.');
    }
    if (error.status === 401) {
      throw new Error(error.message || 'The OTP code is incorrect. Please try again.');
    }
    if (error.status === 429) {
      throw new Error('Too many attempts. Please try again later.');
    }
    throw error;
  }
}
