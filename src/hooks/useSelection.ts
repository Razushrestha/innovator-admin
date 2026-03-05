import { useState, useCallback } from 'react';

export function useSelection<T extends { id: string }>(items: T[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((i) => i.id))
    );
  }, [items]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = (id: string) => selected.has(id);
  const allSelected = items.length > 0 && selected.size === items.length;
  const someSelected = selected.size > 0 && !allSelected;
  const selectedItems = items.filter((i) => selected.has(i.id));

  return { selected, toggle, toggleAll, clear, isSelected, allSelected, someSelected, selectedItems, count: selected.size };
}
