'use client';

import { Trash2, CheckCircle, XCircle, X } from 'lucide-react';

interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'danger' | 'success' | 'warning' | 'default';
}

interface BulkActionBarProps {
  count: number;
  actions: BulkAction[];
  onClear: () => void;
}

const variantStyles: Record<string, string> = {
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  warning: 'bg-amber-500 hover:bg-amber-600 text-black',
  default: 'bg-gray-700 hover:bg-gray-600 text-white',
};

export default function BulkActionBar({ count, actions, onClear }: BulkActionBarProps) {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-2 pr-3 border-r border-gray-700">
        <span className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
          {count}
        </span>
        <span className="text-sm text-gray-300 font-medium">
          {count === 1 ? 'item' : 'items'} selected
        </span>
      </div>
      <div className="flex items-center gap-2">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${variantStyles[action.variant ?? 'default']}`}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
      <button
        onClick={onClear}
        className="ml-1 p-1 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        title="Clear selection"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export { Trash2, CheckCircle, XCircle };
