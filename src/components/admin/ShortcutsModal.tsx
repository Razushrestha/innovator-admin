'use client';

import { useEffect } from 'react';
import { X, Command } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
}

const NAVIGATION: Shortcut[] = [
  { keys: ['Ctrl', 'K'], description: 'Open command palette' },
  { keys: ['Ctrl', '?'], description: 'Show keyboard shortcuts' },
  { keys: ['Esc'], description: 'Close modal / dismiss' },
  { keys: ['↑', '↓'], description: 'Navigate list items' },
  { keys: ['Enter'], description: 'Select / confirm' },
];

const ACTIONS: Shortcut[] = [
  { keys: ['Ctrl', 'N'], description: 'Create new record' },
  { keys: ['Ctrl', 'F'], description: 'Focus search' },
  { keys: ['Ctrl', 'E'], description: 'Export current table' },
  { keys: ['Delete'], description: 'Delete selected rows' },
  { keys: ['Ctrl', 'A'], description: 'Select / deselect all' },
];

const TABLE: Shortcut[] = [
  { keys: ['Click'], description: 'Select row' },
  { keys: ['Dbl-click'], description: 'Inline edit cell' },
  { keys: ['Drag'], description: 'Reorder content items' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ShortcutsModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-2xl bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2 text-gray-200">
            <Command className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-sm">Keyboard Shortcuts</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-800 p-6 gap-y-6 sm:gap-y-0">
          <Section title="Navigation" shortcuts={NAVIGATION} />
          <Section title="Actions" shortcuts={ACTIONS} />
          <Section title="Table" shortcuts={TABLE} />
        </div>

        {/* Footer hint */}
        <div className="px-6 py-3 bg-gray-900/50 border-t border-gray-800 flex items-center gap-2">
          <kbd className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400 text-xs font-mono">Ctrl</kbd>
          <kbd className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400 text-xs font-mono">?</kbd>
          <span className="text-gray-600 text-xs ml-1">to toggle this panel anywhere in the app</span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, shortcuts }: { title: string; shortcuts: Shortcut[] }) {
  return (
    <div className="sm:px-6 first:pl-0 last:pr-0">
      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">{title}</p>
      <ul className="space-y-2.5">
        {shortcuts.map((s) => (
          <li key={s.description} className="flex items-center justify-between gap-3">
            <span className="text-gray-400 text-xs">{s.description}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {s.keys.map((k, i) => (
                <kbd
                  key={i}
                  className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300 text-xs font-mono leading-tight"
                >
                  {k}
                </kbd>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
