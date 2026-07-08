
'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { submitCollaboration, submitSponsorship, getAdminCollaborations, getAdminSponsorships, updateCollabStatus, updateSponsorStatus, getMyCollaborations, getMySponsorships } from '@/lib/api/partnership';
import type { CreateCollaborationDto, CreateSponsorshipDto, PartnershipStatus, SponsorshipPlan } from '@/lib/types';

export const partnershipKeys = {
  all: ['partnerships'] as const,
  collabs: () => [...partnershipKeys.all, 'collabs'] as const,
  sponsors: () => [...partnershipKeys.all, 'sponsors'] as const,
  myCollabs: () => [...partnershipKeys.all, 'my-collabs'] as const,
  mySponsors: () => [...partnershipKeys.all, 'my-sponsors'] as const,
};

export function useSubmitCollabMutation() {
  return useMutation({
    mutationFn: (dto: CreateCollaborationDto) => submitCollaboration(dto),
  });
}

export function useSubmitSponsorMutation() {
  return useMutation({
    mutationFn: (dto: CreateSponsorshipDto) => submitSponsorship(dto),
  });
}

export function useAdminCollabsQuery(status?: PartnershipStatus) {
  return useQuery({
    queryKey: [...partnershipKeys.collabs(), status],
    queryFn: () => getAdminCollaborations(status),
  });
}

export function useAdminSponsorsQuery(status?: PartnershipStatus, plan?: SponsorshipPlan) {
  return useQuery({
    queryKey: [...partnershipKeys.sponsors(), status, plan],
    queryFn: () => getAdminSponsorships(status, plan),
  });
}

export function useUpdateCollabStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string, status: PartnershipStatus, notes?: string }) => updateCollabStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnershipKeys.collabs() });
    },
  });
}

export function useUpdateSponsorStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string, status: PartnershipStatus, notes?: string }) => updateSponsorStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnershipKeys.sponsors() });
    },
  });
}

export function useMyCollaborationsQuery(enabled = true) {
  return useQuery({
    queryKey: partnershipKeys.myCollabs(),
    queryFn: getMyCollaborations,
    enabled,
  });
}

export function useMySponsorshipsQuery(enabled = true) {
  return useQuery({
    queryKey: partnershipKeys.mySponsors(),
    queryFn: getMySponsorships,
    enabled,
  });
}
