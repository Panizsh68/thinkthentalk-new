
'use client';

import { 
  Auth, 
  User, 
  AuthCredential, 
  linkWithCredential, 
  fetchSignInMethodsForEmail 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  Firestore, 
  serverTimestamp 
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface IdentityStatus {
  uid: string;
  hasPhone: boolean;
  hasEmail: boolean;
  providers: string[];
}

/**
 * Syncs the Firebase Auth user state to the Firestore user document.
 * Ensures metadata fields for primary login and linked accounts are updated.
 */
export async function syncUserIdentity(db: Firestore, user: User) {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  
  const providers = user.providerData.map(p => p.providerId);
  const data = {
    email: user.email || null,
    phone: user.phoneNumber || null,
    linkedProviders: providers,
    updatedAt: serverTimestamp(),
  };

  // Only set primaryLoginMethod if it doesn't exist (preserving UID history)
  if (!snap.exists()) {
    Object.assign(data, {
      primaryLoginMethod: user.providerData[0]?.providerId || 'unknown',
      createdAt: serverTimestamp(),
    });
  }

  setDoc(userRef, data, { merge: true }).catch(async (error) => {
    const permissionError = new FirestorePermissionError({
      path: userRef.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

/**
 * Links a new auth method to the existing user.
 * Throws an error if the credential is already in use by another account.
 */
export async function linkNewIdentity(user: User, credential: AuthCredential, db: Firestore) {
  try {
    const result = await linkWithCredential(user, credential);
    // After successful linking, sync to Firestore
    await syncUserIdentity(db, result.user);
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/credential-already-in-use') {
      // Logic for Case 2: DO NOT auto-merge.
      // We throw this specific error so the UI can handle the "Safe Linking Flow"
      // e.g., asking the user if they want to switch accounts or resolve manually.
      throw new Error('This login method is already associated with another account. Auto-merge is disabled for security.');
    }
    throw error;
  }
}

/**
 * Helper to check the current identity status of the user
 */
export function getIdentityStatus(user: User | null): IdentityStatus | null {
  if (!user) return null;

  return {
    uid: user.uid,
    hasPhone: !!user.phoneNumber,
    hasEmail: !!user.email,
    providers: user.providerData.map(p => p.providerId),
  };
}
