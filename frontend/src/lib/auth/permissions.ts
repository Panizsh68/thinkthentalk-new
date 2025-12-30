
import type { AdminRole } from '../types';

export const pagePermissions = {
  dashboard: ['ADMIN', 'EVENT_MANAGER', 'FINANCE'],
  events: ['ADMIN', 'EVENT_MANAGER'],
  registrations: ['ADMIN', 'EVENT_MANAGER', 'FINANCE'],
  users: ['ADMIN', 'EVENT_MANAGER', 'FINANCE'],
  payments: ['ADMIN', 'FINANCE'],
  discounts: ['ADMIN', 'FINANCE'],
  messaging: ['ADMIN', 'EVENT_MANAGER'],
  contact: ['ADMIN', 'EVENT_MANAGER', 'FINANCE'],
  feedback: ['ADMIN', 'EVENT_MANAGER'],
  sponsors: ['ADMIN'],
  team: ['ADMIN'],
} as const;

export type PagePermission = keyof typeof pagePermissions;

export function hasPermission(role: AdminRole, permission: PagePermission): boolean {
  return (pagePermissions[permission] as readonly string[]).includes(role);
}
