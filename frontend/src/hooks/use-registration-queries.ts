'use client';
import { useQuery } from '@tanstack/react-query';
import { getUserRegistrations } from '@/lib/api/registrations';

const registrationKeys = {
  all: ['registrations'] as const,
  lists: () => [...registrationKeys.all, 'list'] as const,
  list: (userId: string) => [...registrationKeys.lists(), { userId }] as const,
};

export function useUserRegistrationsQuery(userId?: string) {
  return useQuery({
    queryKey: registrationKeys.list(userId || ''),
    queryFn: () => getUserRegistrations(userId!),
    enabled: !!userId,
  });
}
