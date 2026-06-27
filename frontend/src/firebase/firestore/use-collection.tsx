'use client';

import { useEffect, useState } from 'react';
import { onSnapshot, Query } from 'firebase/firestore';

export function useCollection<T = any>(query: Query | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;
    return onSnapshot(query, (snapshot) => {
      setData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T));
      setLoading(false);
    });
  }, [query]);

  return { data, loading };
}
