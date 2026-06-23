
'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { submitEventIdea, getAdminEventIdeas, updateIdeaStatus, deleteEventIdea } from '@/lib/api/event-ideas';
import type { CreateEventIdeaDto, EventIdeaStatus, EventIdeaType } from '@/lib/types';

export const ideaKeys = {
  all: ['event-ideas'] as const,
  lists: () => [...ideaKeys.all, 'list'] as const,
  list: (params: any) => [...ideaKeys.lists(), params] as const,
};

export function useSubmitIdeaMutation() {
  return useMutation({
    mutationFn: (dto: CreateEventIdeaDto) => submitEventIdea(dto),
  });
}

export function useAdminIdeasQuery(params: { status?: EventIdeaStatus; type?: EventIdeaType; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ideaKeys.list(params),
    queryFn: () => getAdminEventIdeas(params),
  });
}

export function useUpdateIdeaStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EventIdeaStatus }) => updateIdeaStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ideaKeys.lists() });
    },
  });
}

export function useDeleteIdeaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEventIdea(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ideaKeys.lists() });
    },
  });
}
