'use client';

import { useEffect, useRef, useState } from 'react';
import { getToken, removeToken, refreshAccessToken } from '@/lib/auth';
import { getSecondsUntilExpiry, isTokenExpired } from '@/lib/jwt';
import { useRouter } from 'next/navigation';
import { AlertTriangle, LogOut, RefreshCw } from 'lucide-react';

const WARN_SECONDS = 120;       // show banner in last 2 min
const REFRESH_AT_SECONDS = 300; // attempt silent refresh at 5 min mark

export default function AutoLogoutWarning() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const attempted = useRef(false);

  useEffect(() => {
    const check = async () => {
      const token = getToken();
      if (!token) return;
      if (isTokenExpired(token)) { removeToken(); router.replace('/admin/login'); return; }

      const secs = getSecondsUntilExpiry(token);
      setSecondsLeft(secs);

      // Auto-refresh at 5-minute mark
      if (secs <= REFRESH_AT_SECONDS && !attempted.current) {
        attempted.current = true;
        const ok = await refreshAccessToken();
        if (ok) { setDismissed(true); attempted.current = false; return; }
      }

      if (secs <= 0) { removeToken(); router.replace('/admin/login'); }
    };

    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [router]);

  const handleRefreshNow = async () => {
    setRefreshing(true);
    try {
      const ok = await refreshAccessToken();
      if (ok) {
        setSecondsLeft(getSecondsUntilExpiry(getToken()!));
        setDismissed(true);
        attempted.current = false;
      } else {
        removeToken();
        router.replace('/admin/login');
      }
    } finally {
      setRefreshing(false);
    }
  };

  const showWarning = !dismissed && secondsLeft !== null && secondsLeft <= WARN_SECONDS && secondsLeft > 0;
  if (!showWarning) return null;

  const mins = Math.floor(secondsLeft! / 60);
  const secs = secondsLeft! % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <div className="fixed top-4 right-4 z-[100] flex items-start gap-3 bg-amber-950 border border-amber-700 rounded-xl px-4 py-3 shadow-2xl max-w-sm animate-in slide-in-from-top-2">
      <AlertTriangle size={18} className="text-amber-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-300">Session expiring soon</p>
        <p className="text-xs text-amber-400/80 mt-0.5">
          Expires in <span className="font-mono font-bold">{timeStr}</span>
        </p>
        <div className="flex gap-2 mt-2.5">
          <button onClick={handleRefreshNow} disabled={refreshing}
            className="flex items-center gap-1 text-xs text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 px-2.5 py-1 rounded-md transition-colors">
            <RefreshCw size={10} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Extend session'}
          </button>
          <button onClick={() => { removeToken(); router.replace('/admin/login'); }}
            className="flex items-center gap-1 text-xs text-amber-300 hover:text-white bg-amber-900 hover:bg-amber-800 px-2 py-1 rounded-md transition-colors">
            <LogOut size={10} /> Logout
          </button>
          <button onClick={() => setDismissed(true)}
            className="text-xs text-amber-600 hover:text-amber-300 px-2 py-1 rounded-md transition-colors">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
