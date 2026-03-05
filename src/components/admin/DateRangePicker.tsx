'use client';

import { CalendarDays, X } from 'lucide-react';

interface Props {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  label?: string;
}

export default function DateRangePicker({ from, to, onChange, label }: Props) {
  const hasFilter = !!(from || to);

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5" />
          {label}
        </span>
      )}
      <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2">
        {!label && <CalendarDays className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />}
        <input
          type="date"
          value={from}
          onChange={(e) => onChange(e.target.value, to)}
          className="bg-transparent text-gray-300 text-xs outline-none w-[115px] [color-scheme:dark] cursor-pointer"
          title="From date"
          aria-label="From date"
        />
        <span className="text-gray-600 text-xs">–</span>
        <input
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => onChange(from, e.target.value)}
          className="bg-transparent text-gray-300 text-xs outline-none w-[115px] [color-scheme:dark] cursor-pointer"
          title="To date"
          aria-label="To date"
        />
        {hasFilter && (
          <button
            onClick={() => onChange('', '')}
            className="ml-1 text-gray-600 hover:text-gray-400 transition-colors"
            title="Clear date range"
            aria-label="Clear date range"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
