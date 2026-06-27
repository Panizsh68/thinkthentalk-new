'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, DocumentReference } from 'firebase/firestore';

export function useDoc<T = any>(docRef: DocumentReference | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!docRef) return;
    return onSnapshot(docRef, (snapshot) => {
      setData(snapshot.exists() ? (snapshot.data() as T) : null);
      setLoading(false);
    });
  }, [docRef]);

  return { data, loading };
}
