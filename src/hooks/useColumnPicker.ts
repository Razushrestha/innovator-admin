'use client';

import { useState, useCallback, useEffect } from 'react';

export interface ColumnDef {
  key: string;
  label: string;
  defaultVisible?: boolean;
}

export function useColumnPicker(columns: ColumnDef[], storageKey: string) {
  const [visible, setVisible] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') {
      return Object.fromEntries(columns.map((c) => [c.key, c.defaultVisible ?? true]));
    }
    try {
      const saved = localStorage.getItem(`col-picker:${storageKey}`);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, boolean>;
        // Merge saved state with current columns (handles new columns added later)
        const merged: Record<string, boolean> = {};
        for (const col of columns) {
          merged[col.key] = col.key in parsed ? parsed[col.key] : (col.defaultVisible ?? true);
        }
        return merged;
      }
    } catch {
      // ignore parse errors
    }
    return Object.fromEntries(columns.map((c) => [c.key, c.defaultVisible ?? true]));
  });

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem(`col-picker:${storageKey}`, JSON.stringify(visible));
    } catch {
      // ignore storage errors (e.g. private browsing quota)
    }
  }, [visible, storageKey]);

  const toggleColumn = useCallback((key: string) => {
    setVisible((prev) => {
      // Don't allow hiding the last visible column
      const visibleCount = Object.values(prev).filter(Boolean).length;
      if (prev[key] && visibleCount <= 1) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  }, []);

  const isVisible = useCallback((key: string) => visible[key] ?? true, [visible]);

  const resetToDefault = useCallback(() => {
    setVisible(Object.fromEntries(columns.map((c) => [c.key, c.defaultVisible ?? true])));
  }, [columns]);

  return { visible, toggleColumn, isVisible, resetToDefault };
}
