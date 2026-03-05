'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import clsx from 'clsx';

export type ToastType = 'success' | 'error' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
};

const styles = {
  success: 'bg-emerald-900/80 border-emerald-500/40 text-emerald-200',
  error: 'bg-rose-900/80 border-rose-500/40 text-rose-200',
  warning: 'bg-amber-900/80 border-amber-500/40 text-amber-200',
};

const iconStyles = {
  success: 'text-emerald-400',
  error: 'text-rose-400',
  warning: 'text-amber-400',
};

export default function Toast({ message, type, onClose, duration = 3500 }: ToastProps) {
  const Icon = icons[type];

  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  return (
    <div
      className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-xl text-sm',
        styles[type]
      )}
    >
      <Icon className={clsx('w-4 h-4 flex-shrink-0', iconStyles[type])} />
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
