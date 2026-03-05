'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <html>
      <body style={{ margin: 0, background: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '400px' }}>
          <div style={{ width: 56, height: 56, background: 'rgba(239,68,68,0.1)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <AlertTriangle size={28} color="#f87171" />
          </div>
          <h1 style={{ color: '#f9fafb', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Critical Error</h1>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {error.message?.slice(0, 150) || 'A critical application error occurred.'}
          </p>
          <button
            onClick={reset}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0.625rem 1.25rem', background: '#4f46e5', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            <RefreshCw size={14} />
            Reload App
          </button>
        </div>
      </body>
    </html>
  );
}
