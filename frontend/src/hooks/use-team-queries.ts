
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember, reorderTeamMember } from '@/lib/api/team';
import type { TeamMemberFormData } from '@/lib/types';

const teamKeys = {
  all: ['team'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  list: (params: { isAdmin?: boolean }) => [...teamKeys.lists(), params] as const,
};

export function useTeamMembersQuery(params: { isAdmin?: boolean } = {}) {
  return useQuery({
    queryKey: teamKeys.list(params),
    queryFn: () => getTeamMembers(params),
  });
}

export function useCreateTeamMemberMutation({ onSuccess, onError }: { onSuccess?: () => void, onError?: (error: Error) => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: TeamMemberFormData) => createTeamMember(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
            onSuccess?.();
        },
        onError,
    });
}

export function useUpdateTeamMemberMutation({ onSuccess, onError }: { onSuccess?: () => void, onError?: (error: Error) => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: TeamMemberFormData }) => updateTeamMember(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
            onSuccess?.();
        },
        onError,
    });
}

export function useDeleteTeamMemberMutation({ onSuccess, onError }: { onSuccess?: () => void, onError?: (error: Error) => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteTeamMember(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
            onSuccess?.();
        },
        onError,
    });
}

export function useReorderTeamMemberMutation({ onSuccess, onError }: { onSuccess?: () => void, onError?: (error: Error) => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ memberId, direction }: { memberId: string; direction: 'up' | 'down' }) =>
            reorderTeamMember(memberId, direction),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
            onSuccess?.();
        },
        onError,
    });
}
