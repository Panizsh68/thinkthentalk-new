import apiClient from './client';

export interface SendContactPayload {
  name?: string;
  email: string;
  message: string;
  language?: string;
  website?: string;
}

export interface SendContactResponse {
  success: boolean;
  message: string;
}

export async function sendContactMessage(payload: SendContactPayload): Promise<SendContactResponse> {
  const { data } = await apiClient.post<SendContactResponse>('/contact', payload);
  return data;
}
