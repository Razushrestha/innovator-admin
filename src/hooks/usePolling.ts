import { useEffect, useRef, useCallback } from 'react';

export function usePolling(
  fn: () => void | Promise<void>,
  intervalMs: number,
  enabled = true
): { restart: () => void } {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const start = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!enabled) return;
    timerRef.current = setInterval(() => {
      void fnRef.current();
    }, intervalMs);
  }, [intervalMs, enabled]);

  useEffect(() => {
    start();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [start]);

  return { restart: start };
}
