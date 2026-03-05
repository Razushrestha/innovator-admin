'use client';

import { useState, useRef, useEffect } from 'react';
import { Columns, RotateCcw } from 'lucide-react';
import type { ColumnDef } from '@/hooks/useColumnPicker';

interface Props {
  columns: ColumnDef[];
  isVisible: (key: string) => boolean;
  onToggle: (key: string) => void;
  onReset?: () => void;
}

export default function ColumnPicker({ columns, isVisible, onToggle, onReset }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const visibleCount = columns.filter((c) => isVisible(c.key)).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-2.5 text-sm rounded-lg border transition-colors ${
          open
            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
            : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600'
        }`}
        aria-label="Toggle columns"
        aria-expanded={open}
      >
        <Columns className="w-3.5 h-3.5" />
        <span className="text-xs">Columns</span>
        {visibleCount < columns.length && (
          <span className="ml-0.5 px-1 py-0.5 bg-indigo-600/30 text-indigo-400 rounded text-xs leading-none">
            {visibleCount}/{columns.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-30 w-52 bg-gray-900 border border-gray-700 rounded-xl shadow-xl py-1.5 animate-in fade-in slide-in-from-top-2 duration-100">
          <div className="px-3 py-1.5 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Show / Hide Columns</span>
            {onReset && (
              <button
                onClick={onReset}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-indigo-400 transition-colors"
                title="Reset to defaults"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="h-px bg-gray-800 mx-2 my-1" />
          {columns.map((col) => {
            const vis = isVisible(col.key);
            return (
              <label
                key={col.key}
                className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gray-800/60 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={vis}
                  onChange={() => onToggle(col.key)}
                  className="rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span className={`text-xs ${vis ? 'text-gray-300' : 'text-gray-600'}`}>
                  {col.label}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
