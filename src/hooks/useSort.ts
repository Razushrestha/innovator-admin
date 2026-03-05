import { useState, useMemo } from 'react';

export type SortDir = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  dir: SortDir;
}

export function useSort<T extends object>(items: T[], defaultKey = '') {
  const [sort, setSort] = useState<SortConfig>({ key: defaultKey, dir: 'asc' });

  const toggle = (key: string) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  };

  const sorted = useMemo(() => {
    if (!sort.key) return items;
    return [...items].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sort.key];
      const bv = (b as Record<string, unknown>)[sort.key];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [items, sort]);

  return { sorted, sort, toggle };
}
