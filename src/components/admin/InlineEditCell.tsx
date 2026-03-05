'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface InlineEditCellProps {
  /** Current displayed value */
  value: string;
  /** Called when user confirms a new value; throw to show error */
  onSave: (newValue: string) => Promise<void>;
  /** Input type for the editor (default: 'text') */
  type?: 'text' | 'number';
  /** Optional placeholder for empty values */
  placeholder?: string;
  /** Extra classes applied to the read-mode span */
  className?: string;
  /** Disabled — renders plain text, no editing */
  disabled?: boolean;
}

/**
 * Double-click to edit an inline cell.
 * - Enter or ✓ button saves; Escape or ✕ cancels.
 * - Shows spinner while saving.
 * - Falls back to original value on error.
 */
export default function InlineEditCell({
  value,
  onSave,
  type = 'text',
  placeholder = '—',
  className,
  disabled = false,
}: InlineEditCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync draft when external value changes (e.g. after server round-trip)
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  // Auto-focus + select on enter edit mode
  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const enterEdit = () => {
    if (disabled) return;
    setDraft(value);
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(value);
    setError(null);
    setEditing(false);
  };

  const save = async () => {
    const trimmed = type === 'text' ? draft.trim() : draft;
    if (trimmed === value) { setEditing(false); return; }
    if (!trimmed) { setError('Value cannot be empty'); return; }
    
    // --- OPTIMISTIC UI ---
    // Instantly hide editing mode so user sees the change immediately
    setEditing(false); 
    setSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
      // Value will stay as draft via external prop update
    } catch (e) {
      // --- ROLLBACK ---
      setError(e instanceof Error ? e.message : 'Save failed');
      setDraft(value); // Revert local state to previous value
      setEditing(true); // Re-open for fixing if it failed
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <span
        onDoubleClick={enterEdit}
        title={disabled ? undefined : 'Double-click to edit'}
        className={clsx(
          'inline-block rounded px-1 -mx-1 transition-colors',
          !disabled && 'cursor-text hover:bg-gray-800/60 hover:ring-1 hover:ring-indigo-500/40',
          !value && 'text-gray-500',
          className
        )}
      >
        {value || placeholder}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1">
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); save(); }
            if (e.key === 'Escape') cancel();
          }}
          disabled={saving}
          className={clsx(
            'bg-gray-800 border rounded px-2 py-0.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500',
            error ? 'border-rose-500' : 'border-indigo-500',
            type === 'number' ? 'w-20' : 'w-36'
          )}
        />
        {saving ? (
          <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
        ) : (
          <>
            <button
              onClick={save}
              title="Save (Enter)"
              className="p-0.5 rounded text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={cancel}
              title="Cancel (Esc)"
              className="p-0.5 rounded text-gray-400 hover:bg-gray-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </span>
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </span>
  );
}
