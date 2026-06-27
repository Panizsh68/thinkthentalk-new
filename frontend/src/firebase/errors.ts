'use client';

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  constructor(public context: SecurityRuleContext) {
    super(`Firestore Permission Denied at ${context.path}`);
    this.name = 'FirestorePermissionError';
  }
}
