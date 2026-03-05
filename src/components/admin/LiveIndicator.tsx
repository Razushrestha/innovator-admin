'use client';

import type { SSEStatus } from '@/hooks/useSSE';
import clsx from 'clsx';

interface LiveIndicatorProps {
  status: SSEStatus;
  className?: string;
}

const STATUS_LABEL: Record<SSEStatus, string> = {
  connected: 'Live',
  connecting: 'Connecting…',
  disconnected: 'Offline',
};

const STATUS_COLOR: Record<SSEStatus, string> = {
  connected: 'bg-emerald-500',
  connecting: 'bg-amber-400',
  disconnected: 'bg-rose-500',
};

const TEXT_COLOR: Record<SSEStatus, string> = {
  connected: 'text-emerald-400',
  connecting: 'text-amber-400',
  disconnected: 'text-rose-400',
};

/**
 * Pulsing dot + label that reflects the SSE connection state.
 * Shows "Live" in green when connected, amber while reconnecting, red when offline.
 */
export default function LiveIndicator({ status, className }: LiveIndicatorProps) {
  return (
    <div
      className={clsx('flex items-center gap-1.5 select-none', className)}
      title={`Real-time updates: ${STATUS_LABEL[status]}`}
    >
      <span className="relative flex h-2 w-2">
        {status === 'connected' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span className={clsx('relative inline-flex rounded-full h-2 w-2', STATUS_COLOR[status])} />
      </span>
      <span className={clsx('text-xs font-medium hidden sm:inline', TEXT_COLOR[status])}>
        {STATUS_LABEL[status]}
      </span>
    </div>
  );
}
