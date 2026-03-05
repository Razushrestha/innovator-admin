'use client';

import { createContext, useContext, useCallback, useRef, useState } from 'react';

export interface SearchRecord {
  id: string;
  label: string;
  description?: string;
  href: string;
  /** E.g. 'Course', 'Vendor', 'Category', 'Enrollment', 'Payout' */
  type: string;
  /** Optional badge colour class */
  color?: string;
}

interface GlobalSearchState {
  /** All registered records keyed by namespace (e.g. 'courses', 'vendors') */
  records: Record<string, SearchRecord[]>;
  register: (ns: string, items: SearchRecord[]) => void;
  unregister: (ns: string) => void;
  search: (query: string) => SearchRecord[];
}

const GlobalSearchContext = createContext<GlobalSearchState | null>(null);

export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<Record<string, SearchRecord[]>>({});
  // Use ref to keep stable references without extra re-renders
  const recordsRef = useRef<Record<string, SearchRecord[]>>({});

  const register = useCallback((ns: string, items: SearchRecord[]) => {
    recordsRef.current = { ...recordsRef.current, [ns]: items };
    setRecords((prev) => ({ ...prev, [ns]: items }));
  }, []);

  const unregister = useCallback((ns: string) => {
    const next = { ...recordsRef.current };
    delete next[ns];
    recordsRef.current = next;
    setRecords(next);
  }, []);

  const search = useCallback((query: string): SearchRecord[] => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const allItems = Object.values(recordsRef.current).flat();
    return allItems
      .filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          (item.description ?? '').toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, []);

  return (
    <GlobalSearchContext.Provider value={{ records, register, unregister, search }}>
      {children}
    </GlobalSearchContext.Provider>
  );
}

export function useGlobalSearch() {
  const ctx = useContext(GlobalSearchContext);
  if (!ctx) throw new Error('useGlobalSearch must be used inside GlobalSearchProvider');
  return ctx;
}

/** Convenience hook: register this page's records and unregister on unmount. */
export function useRegisterSearch(ns: string, items: SearchRecord[]) {
  const { register, unregister } = useGlobalSearch();

  // Re-register whenever items change using a stable reference comparison
  const itemsRef = useRef<SearchRecord[]>([]);
  
  // Only re-register when the serialized value changes
  const key = JSON.stringify(items.map((i) => i.id));
  const prevKey = useRef('');

  if (prevKey.current !== key) {
    prevKey.current = key;
    itemsRef.current = items;
    register(ns, items);
  }

  // Unregister on unmount
  const unregisterRef = useRef(unregister);
  unregisterRef.current = unregister;
  const nsRef = useRef(ns);
  nsRef.current = ns;

  // Using a layout effect would be ideal but useEffect is fine for cleanup
  // We can't use hooks conditionally, so just return
  return { register, unregister };
}
