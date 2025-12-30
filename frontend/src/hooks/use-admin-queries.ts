
'use client';

import { useQuery } from '@tanstack/react-query';
import { getAdminStats } from '@/lib/api/admin';
import type { AdminStats } from '@/lib/types';


export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
};


export function useAdminStatsQuery() {
    return useQuery<AdminStats>({
        queryKey: adminKeys.stats(),
        queryFn: getAdminStats,
    });
}
