
'use client';
import apiClient from './client';
import type { Payment, AdminPaymentsQueryDto } from '@/lib/types';

const transformPayment = (payment: any): Payment => ({
  ...payment,
  amount: Number(payment.amount),
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});


export async function getAdminPayments(filters: AdminPaymentsQueryDto): Promise<Payment[]> {
  const params = new URLSearchParams();
  if (filters.eventId) params.append('eventId', filters.eventId);
  if (filters.status) params.append('status', filters.status);
  
  try {
    const { data } = await apiClient.get<any[]>(`/admin/payments?${params.toString()}`);
    return data.map(transformPayment);
  } catch (error: any) {
    console.error("Failed to fetch admin payments:", error);
    throw new Error(error.message || "Failed to fetch payments.");
  }
}
