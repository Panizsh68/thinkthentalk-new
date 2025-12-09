
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import * as authApi from '@/lib/api/auth';
import * as userApi from '@/lib/api/user';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestOtp: (mobile: string) => Promise<void>;
  verifyOtp: (mobile: string, otp: string) => Promise<void>;
  updateUserProfile: (userData: Partial<User>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/profile')) {
      router.push('/');
    }
  }, [router, pathname]);


  const fetchProfile = useCallback(async () => {
    try {
      const userProfile = await userApi.getProfile();
      setCurrentUser(userProfile);
      localStorage.setItem('currentUser', JSON.stringify(userProfile));
    } catch (error) {
      console.error('Session expired or invalid, logging out.', error);
      logout();
    }
  }, [logout]);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await fetchProfile();
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, [fetchProfile]);


  const handleLogin = (user: User, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('accessToken', token);
  };

  const requestOtp = useCallback(async (mobile: string) => {
    await authApi.requestOtp(mobile);
  }, []);

  const verifyOtp = useCallback(async (mobile: string, otp: string) => {
    const { user, token } = await authApi.verifyOtp(mobile, otp);
    handleLogin(user, token);
  }, []);

  const updateUserProfile = useCallback(async (userData: Partial<Omit<User, 'id' | 'mobile'>>) => {
    const updatedUser = await userApi.updateUserProfile(userData);
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  }, []);


  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isLoading,
    requestOtp,
    verifyOtp,
    updateUserProfile,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
