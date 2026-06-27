'use client';

import { useMemo } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { linkNewIdentity, syncUserIdentity } from '@/lib/auth-identity';
import { AuthCredential } from 'firebase/auth';

export interface IdentityStatus {
  uid: string;
  hasPhone: boolean;
  hasEmail: boolean;
  providers: string[];
}

/**
 * Hook to manage account linking and identity synchronization.
 */
export function useAuthIdentity() {
  const { user } = useUser();
  const db = useFirestore();

  const status: IdentityStatus | null = useMemo(() => {
    if (!user) return null;
    return {
      uid: user.uid,
      hasPhone: !!user.phoneNumber,
      hasEmail: !!user.email,
      providers: user.providerData.map(p => p.providerId),
    };
  }, [user]);

  const linkMethod = async (credential: AuthCredential) => {
    if (!user || !db) throw new Error('No active session found.');
    return await linkNewIdentity(user, credential, db);
  };

  const syncProfile = async () => {
    if (!user || !db) return;
    await syncUserIdentity(db, user);
  };

  return {
    status,
    linkMethod,
    syncProfile,
    isLinked: (providerId: string) => status?.providers.includes(providerId) ?? false,
  };
}
