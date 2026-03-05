'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type SSEStatus = 'connecting' | 'connected' | 'disconnected';

interface SSEOptions {
  /** Called for every non-heartbeat message */
  onMessage?: (data: Record<string, unknown>) => void;
  /** Reconnect delay in ms (default 3 000) */
  reconnectDelay?: number;
  /** Disable the hook (e.g. when unauthenticated) */
  disabled?: boolean;
}

/**
 * Subscribes to a Server-Sent Events stream.
 * Auto-reconnects on error/close. Exposes connection status.
 * Pass `disabled: true` to skip connecting (e.g. login page).
 */
export function useSSE(url: string, options: SSEOptions = {}): SSEStatus {
  const { onMessage, reconnectDelay = 3_000, disabled = false } = options;
  const [status, setStatus] = useState<SSEStatus>('connecting');
  const esRef = useRef<EventSource | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (disabled) return;
    esRef.current?.close();
    setStatus('connecting');
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => setStatus('connected');

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string) as Record<string, unknown>;
        if (data.type === 'heartbeat') return; // ignore pings
        onMessageRef.current?.(data);
      } catch { /* malformed */ }
    };

    es.onerror = () => {
      es.close();
      setStatus('disconnected');
      // Schedule reconnect
      timerRef.current = setTimeout(connect, reconnectDelay);
    };
  }, [url, disabled, reconnectDelay]);

  useEffect(() => {
    if (disabled) {
      setStatus('disconnected');
      return;
    }
    connect();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      esRef.current?.close();
    };
  }, [connect, disabled]);

  return status;
}
