'use client';

import { 
  User, 
  AuthCredential, 
  linkWithCredential 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  Firestore, 
  serverTimestamp 
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

/**
 * Syncs the Firebase Auth user state to the Firestore user document.
 * Preserves the existing UID while updating provider metadata.
 */
export async function syncUserIdentity(db: Firestore, user: User) {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  
  const providers = user.providerData.map(p => p.providerId);
  const data: any = {
    email: user.email || null,
    phone: user.phoneNumber || null,
    linkedProviders: providers,
    updatedAt: serverTimestamp(),
  };

  // Only set creation metadata if the document is new
  if (!snap.exists()) {
    data.primaryLoginMethod = user.providerData[0]?.providerId || 'unknown';
    data.createdAt = serverTimestamp();
    // Maintain legacy field for backward compatibility
    if (user.phoneNumber) data.mobile = user.phoneNumber;
  }

  setDoc(userRef, data, { merge: true }).catch(async (error) => {
    const permissionError = new FirestorePermissionError({
      path: userRef.path,
      operation: 'update',
      requestResourceData: data,
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
  });
}

/**
 * Wraps linkWithCredential to implement the Safe Linking Flow.
 * Explicitly rejects auto-merges if the method is already in use.
 */
export async function linkNewIdentity(user: User, credential: AuthCredential, db: Firestore) {
  try {
    const result = await linkWithCredential(user, credential);
    // After successful linking, update the metadata store
    await syncUserIdentity(db, result.user);
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/credential-already-in-use') {
      // REQUIREMENT: DO NOT auto-merge.
      // This informs the UI that a manual resolution flow is needed.
      throw new Error('This login method is already associated with a different community account. Please use the original account or contact support to merge.');
    }
    throw error;
  }
}