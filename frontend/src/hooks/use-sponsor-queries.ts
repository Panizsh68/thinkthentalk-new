
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSponsors, createSponsor, updateSponsor, deleteSponsor } from '@/lib/api/sponsors';
import type { SponsorFormData } from '@/lib/types';

const sponsorKeys = {
  all: ['sponsors'] as const,
  lists: () => [...sponsorKeys.all, 'list'] as const,
  list: (params: { isAdmin?: boolean }) => [...sponsorKeys.lists(), params] as const,
};

export function useSponsorsQuery(params: { isAdmin?: boolean } = {}) {
  return useQuery({
    queryKey: sponsorKeys.list(params),
    queryFn: () => getSponsors(params),
  });
}

export function useCreateSponsorMutation({ onSuccess, onError }: { onSuccess?: () => void, onError?: (error: Error) => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: SponsorFormData) => createSponsor(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: sponsorKeys.lists() });
            onSuccess?.();
        },
        onError,
    });
}

export function useUpdateSponsorMutation({ onSuccess, onError }: { onSuccess?: () => void, onError?: (error: Error) => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: SponsorFormData }) => updateSponsor(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: sponsorKeys.lists() });
            onSuccess?.();
        },
        onError,
    });
}

export function useDeleteSponsorMutation({ onSuccess, onError }: { onSuccess?: () => void, onError?: (error: Error) => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteSponsor(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: sponsorKeys.lists() });
            onSuccess?.();
        },
        onError,
    });
}
