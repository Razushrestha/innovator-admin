'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Admin Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
          <AlertTriangle className="w-8 h-8 text-rose-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            {error.message?.slice(0, 200) || 'An unexpected error occurred in the admin panel.'}
          </p>
          {error.digest && (
            <p className="text-gray-700 text-xs mt-2 font-mono">Error ID: {error.digest}</p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href="/admin"
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
