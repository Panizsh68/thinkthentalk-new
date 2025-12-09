
export type AdminRole = 'ADMIN' | 'EVENT_MANAGER' | 'FINANCE';

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
};

// This type is only for mock data and should never be exposed to the client
export type AdminUserWithPassword = AdminUser & { password: string };


export type AdminStats = {
  upcomingEvents: number;
  totalRegistrations: number;
  paidRegistrations: number;
  totalRevenue: number;
};

