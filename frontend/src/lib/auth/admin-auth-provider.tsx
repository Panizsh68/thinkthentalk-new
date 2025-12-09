
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as adminAuthApi from '@/lib/api/admin-auth';
import type { AdminUser, AdminRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AdminAuthContextType {
  currentAdmin: AdminUser | null;
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: any) => boolean; // Simplified for client-side checks
  role: AdminRole | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_STORAGE_KEY = 'currentAdminUser';
const ADMIN_TOKEN_KEY = 'adminAccessToken';

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedAdmin = localStorage.getItem(ADMIN_STORAGE_KEY);
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (storedAdmin && token) {
        setCurrentAdmin(JSON.parse(storedAdmin));
      }
    } catch (error) {
      console.error('Failed to parse admin user from localStorage', error);
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSetCurrentAdmin = (admin: AdminUser | null, token: string | null) => {
    setCurrentAdmin(admin);
    if (admin && token) {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admin));
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
     const { user, token } = await adminAuthApi.login(email, password);
     handleSetCurrentAdmin(user, token);
  }, []);

  const logout = useCallback(() => {
    handleSetCurrentAdmin(null, null);
    if(pathname.startsWith('/admin')) {
      router.push('/admin/login');
    }
    toast({ title: 'Admin Logged Out' });
  }, [router, toast, pathname]);
  

  const value = {
    currentAdmin,
    isAdminAuthenticated: !!currentAdmin,
    isLoading,
    login,
    logout,
    role: currentAdmin?.role || null,
    // Note: this is a simple client-side check. Real security is on the backend.
    hasPermission: (permission: any) => {
        // This is a placeholder. For a real app, you'd have a proper permission system.
        if (!currentAdmin) return false;
        if (currentAdmin.role === 'ADMIN') return true;
        // ... add more logic here based on permission definitions
        return false;
    }
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
