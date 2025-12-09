
'use client';
import type { Payment, TicketType, CreatePaymentBodyDto, VerifyPaymentStatusDto } from '@/lib/types';
import type { RegistrationFormData } from '@/hooks/use-registration-wizard-store';
import apiClient from './client';

const transformPayment = (payment: any): Payment => ({
  ...payment,
  amount: Number(payment.amount),
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});


export async function createPayment(payload: CreatePaymentBodyDto): Promise<Payment> {
  try {
    const { data } = await apiClient.post<any>('/payments', payload);
    return transformPayment(data);
  } catch (error: any) {
    console.error('Failed to create payment:', error);
    throw new Error(error.message || 'Failed to initiate registration.');
  }
}

export async function getPaymentById(paymentId: string): Promise<Payment | null> {
  try {
    const { data } = await apiClient.get<any>(`/payments/${paymentId}`);
    if (!data) return null;
    return transformPayment(data);
  } catch (error: any) {
     if (error.status === 404) {
      return null;
    }
    console.error(`Failed to fetch payment ${paymentId}:`, error);
    throw error;
  }
}

export async function verifyPayment(paymentId: string, status: 'SUCCESS' | 'FAILED'): Promise<Payment> {
    const payload: VerifyPaymentStatusDto = { status };
    try {
        const { data } = await apiClient.post<any>(`/payments/${paymentId}`, payload);
        return transformPayment(data);
    } catch (error: any) {
        console.error(`Failed to verify payment ${paymentId}:`, error);
        throw new Error(error.message || 'Failed to verify payment status.');
    }
}
