
'use client';
import apiClient from './client';
import type { SendBulkMessageDto } from '@/lib/types';

export async function sendBulkMessage(dto: SendBulkMessageDto): Promise<{ success: boolean; message: string }> {
  try {
    const { data } = await apiClient.post<{ success: boolean; message: string }>('/admin/messaging/send', dto);
    return data;
  } catch (error: any) {
    console.error('Failed to send bulk message:', error);
    throw new Error(error.message || 'Failed to send messages.');
  }
}
