'use client';
import { useQuery } from '@tanstack/react-query';
import { getAdminUser, getAdminUsers } from '@/lib/api/admin-users';
import type { AdminUsersQuery } from '@/lib/types';

export const adminUsersKeys = {
  all: ['admin', 'users'] as const,
  list: (filters: AdminUsersQuery) => [...adminUsersKeys.all, 'list', filters] as const,
  detail: (id: string) => [...adminUsersKeys.all, 'detail', id] as const,
};

export function useAdminUsersQuery(filters: AdminUsersQuery = {}) {
  return useQuery({
    queryKey: adminUsersKeys.list(filters),
    queryFn: () => getAdminUsers(filters),
  });
}

export function useAdminUserQuery(userId?: string) {
  return useQuery({
    queryKey: adminUsersKeys.detail(userId ?? ''),
    queryFn: () => getAdminUser(userId!),
    enabled: !!userId,
  });
}
