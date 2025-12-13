
'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPayment, getPaymentById, getPaymentPublic, verifyPayment } from '@/lib/api/payments';
import { getAdminPayments } from '@/lib/api/admin-payments';
import type { CreatePaymentBodyDto, AdminPaymentsQueryDto } from '@/lib/types';

export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters: any) => [...paymentKeys.lists(), filters] as const,
  adminLists: () => [...paymentKeys.all, 'admin-list'] as const,
  adminList: (filters: AdminPaymentsQueryDto) => [...paymentKeys.adminLists(), filters] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  publicDetails: () => [...paymentKeys.all, 'public-detail'] as const,
  publicDetail: (id: string, status?: string, authority?: string | null) =>
    [...paymentKeys.publicDetails(), id, status ?? null, authority ?? null] as const,
};

export function useCreatePaymentMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreatePaymentBodyDto) => createPayment(data),
        onSuccess: (payment) => {
            queryClient.setQueryData(paymentKeys.detail(payment.id), payment);
        },
    });
}

export function usePaymentQuery(paymentId: string | null) {
  return useQuery({
    queryKey: paymentKeys.detail(paymentId || ''),
    queryFn: () => getPaymentById(paymentId!),
    enabled: !!paymentId,
  });
}

export function usePaymentPublicQuery(
  paymentId: string | null,
  params?: { status?: 'SUCCESS' | 'FAILED'; authority?: string | null },
) {
  return useQuery({
    queryKey: paymentKeys.publicDetail(paymentId || '', params?.status, params?.authority ?? null),
    queryFn: () => getPaymentPublic(paymentId!, params),
    enabled: !!paymentId,
  });
}

export function useAdminPaymentsQuery(filters: AdminPaymentsQueryDto) {
  return useQuery({
    queryKey: paymentKeys.adminList(filters),
    queryFn: () => getAdminPayments(filters)
  });
}


export function useVerifyPaymentMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { paymentId: string; status: 'SUCCESS' | 'FAILED' }) =>
            verifyPayment(data.paymentId, data.status),
        onSuccess: (payment) => {
            queryClient.invalidateQueries({ queryKey: paymentKeys.detail(payment.id) });
            queryClient.invalidateQueries({ queryKey: ['registrations'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] });
            queryClient.invalidateQueries({ queryKey: paymentKeys.adminLists() });
        },
    });
}
