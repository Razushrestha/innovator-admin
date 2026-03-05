import { useState, useMemo } from 'react';

export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
  const next = () => goTo(safePage + 1);
  const prev = () => goTo(safePage - 1);
  const reset = () => setPage(1);

  return {
    page: safePage,
    totalPages,
    paged,
    goTo,
    next,
    prev,
    reset,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
    from: items.length === 0 ? 0 : (safePage - 1) * pageSize + 1,
    to: Math.min(safePage * pageSize, items.length),
    total: items.length,
  };
}
