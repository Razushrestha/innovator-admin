'use client';

import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { SortConfig } from '@/hooks/useSort';

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  sort: SortConfig;
  onToggle: (key: string) => void;
  className?: string;
}

export default function SortableHeader({ label, sortKey, sort, onToggle, className = '' }: SortableHeaderProps) {
  const active = sort.key === sortKey;
  return (
    <th
      onClick={() => onToggle(sortKey)}
      className={`px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-white transition-colors group ${className}`}
    >
      <span className="flex items-center gap-1.5">
        {label}
        <span className={`transition-colors ${active ? 'text-indigo-400' : 'text-gray-600 group-hover:text-gray-400'}`}>
          {active && sort.dir === 'asc' ? (
            <ChevronUp size={13} />
          ) : active && sort.dir === 'desc' ? (
            <ChevronDown size={13} />
          ) : (
            <ChevronsUpDown size={13} />
          )}
        </span>
      </span>
    </th>
  );
}
