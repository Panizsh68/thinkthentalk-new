
'use client';

import { useMemo } from 'react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { getIdentityStatus, IdentityStatus, linkNewIdentity } from '@/lib/auth-identity';
import { AuthCredential } from 'firebase/auth';

/**
 * A specialized hook to manage the Unified Identity System.
 */
export function useAuthIdentity() {
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  const status: IdentityStatus | null = useMemo(() => {
    return user ? getIdentityStatus(user) : null;
  }, [user]);

  const linkMethod = async (credential: AuthCredential) => {
    if (!user || !db) throw new Error('No authenticated user or database found.');
    return await linkNewIdentity(user, credential, db);
  };

  return {
    status,
    linkMethod,
    isLinked: (providerId: string) => status?.providers.includes(providerId) ?? false,
  };
}
