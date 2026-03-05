'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Compass } from 'lucide-react';

export default function AdminNotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Big 404 */}
        <div className="relative">
          <p className="text-[120px] font-black text-gray-900 leading-none select-none">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center justify-center">
              <Compass className="w-10 h-10 text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">Page not found</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            The admin page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
          <Link
            href="/admin"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>

        {/* Sub-links */}
        <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1 justify-center">
          {[
            ['Courses', '/admin/courses'],
            ['Vendors', '/admin/vendors'],
            ['Payouts', '/admin/payouts'],
            ['Settings', '/admin/settings'],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="text-xs text-gray-600 hover:text-indigo-400 transition-colors">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
