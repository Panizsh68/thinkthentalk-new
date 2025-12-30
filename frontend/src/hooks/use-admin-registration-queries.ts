
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllRegistrations, getRegistrationById, updateRegistration as apiUpdateRegistration } from '@/lib/api/admin-registrations';
import type { AdminRegistrationsQueryDto, UpdateRegistrationAdminDto } from '@/lib/types';

export const adminRegistrationKeys = {
  all: ['admin', 'registrations'] as const,
  lists: () => [...adminRegistrationKeys.all, 'list'] as const,
  list: (filters: AdminRegistrationsQueryDto) => [...adminRegistrationKeys.lists(), filters] as const,
  details: () => [...adminRegistrationKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminRegistrationKeys.details(), id] as const,
};

export function useAllRegistrationsQuery(filters: AdminRegistrationsQueryDto = {}) {
  return useQuery({
    queryKey: adminRegistrationKeys.list(filters),
    queryFn: () => getAllRegistrations(filters),
  });
}

export function useRegistrationQuery(id: string) {
  return useQuery({
    queryKey: adminRegistrationKeys.detail(id),
    queryFn: () => getRegistrationById(id),
    enabled: !!id,
  });
}

export function useUpdateRegistrationMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: { registrationId: string; updates: UpdateRegistrationAdminDto }) => 
            apiUpdateRegistration(payload.registrationId, payload.updates),
        onSuccess: (updatedRegistration) => {
            // Invalidate the list of all registrations to show the update
            queryClient.invalidateQueries({ queryKey: adminRegistrationKeys.lists() });
            
            // Update the specific registration detail query cache
            queryClient.setQueryData(adminRegistrationKeys.detail(updatedRegistration.id), updatedRegistration);
        }
    })
}
