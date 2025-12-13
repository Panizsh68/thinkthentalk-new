
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDiscounts, getPublicDiscounts, createDiscount, updateDiscount, deleteDiscount, validateDiscountCode } from '@/lib/api/discounts';
import type { DiscountFormData, UpdateDiscountFormDataDto, ValidateDiscountDto } from '@/lib/types';

const discountKeys = {
  all: ['discounts'] as const,
  lists: () => [...discountKeys.all, 'list'] as const,
  list: (scope: 'admin' | 'public', eventId?: string | null) => [...discountKeys.lists(), scope, eventId ?? null] as const,
  details: () => [...discountKeys.all, 'detail'] as const,
  detail: (id: string) => [...discountKeys.details(), id] as const,
};

export function useDiscountsQuery(options?: { scope?: 'admin' | 'public'; eventId?: string | null }) {
  const scope = options?.scope ?? 'admin';
  const eventId = options?.eventId ?? null;
  const queryFn = scope === 'admin' ? getDiscounts : () => getPublicDiscounts(eventId ?? undefined);

  return useQuery({
    queryKey: discountKeys.list(scope, eventId),
    queryFn,
  });
}

export function useDiscountQuery(id: string) {
  return useQuery({
    queryKey: discountKeys.detail(id),
    queryFn: async () => {
        const queryClient = useQueryClient();
        const allDiscounts = await queryClient.fetchQuery({ queryKey: discountKeys.list(), queryFn: getDiscounts });
        const discount = allDiscounts.find(d => d.id === id);
        if (!discount) {
            throw new Error('Discount not found');
        }
        return discount;
    },
    enabled: !!id,
  });
}

export function useCreateDiscountMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: DiscountFormData) => createDiscount(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: discountKeys.lists() });
        }
    });
}

export function useUpdateDiscountMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<UpdateDiscountFormDataDto>}) => updateDiscount(id, data),
        onSuccess: (updatedDiscount) => {
            queryClient.invalidateQueries({ queryKey: discountKeys.lists() });
            queryClient.setQueryData(discountKeys.detail(updatedDiscount.id), updatedDiscount);
        }
    });
}

export function useDeleteDiscountMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteDiscount(id),
        onSuccess: (deleted) => {
            queryClient.invalidateQueries({ queryKey: discountKeys.lists() });
        }
    })
}

export function useValidateDiscountMutation() {
  return useMutation({
    mutationFn: (vars: ValidateDiscountDto) => validateDiscountCode(vars),
  });
}
