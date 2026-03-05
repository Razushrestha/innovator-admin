'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, RefreshCw, LogOut, Menu, Clock, Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { removeToken } from '@/lib/auth';
import ThemeToggle from '@/components/admin/ThemeToggle';
import LiveIndicator from '@/components/admin/LiveIndicator';
import { useSidebar } from '@/context/SidebarContext';
import { useActivity, ActivityEntry } from '@/context/ActivityContext';
import clsx from 'clsx';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  loading?: boolean;
  /** SSE status — if provided, shows the live indicator */
  sseStatus?: import('@/hooks/useSSE').SSEStatus;
}

const activityIcon: Record<ActivityEntry['type'], React.ElementType> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  approve: CheckCircle,
  reject: XCircle,
  login: CheckCircle,
  info: Clock,
};

const activityColor: Record<ActivityEntry['type'], string> = {
  create: 'text-emerald-400',
  update: 'text-indigo-400',
  delete: 'text-rose-400',
  approve: 'text-emerald-400',
  reject: 'text-rose-400',
  login: 'text-blue-400',
  info: 'text-gray-400',
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Header({ title, subtitle, onRefresh, loading, sseStatus }: HeaderProps) {
  const router = useRouter();
  const { openMobile } = useSidebar();
  const { activities } = useActivity();
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Recent = last 8 activities, "new" = last hour
  const recent = activities.slice(0, 8);
  const newCount = activities.filter(
    (a) => Date.now() - new Date(a.timestamp).getTime() < 3_600_000
  ).length;

  // Close on outside click
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  const handleLogout = () => {
    removeToken();
    router.push('/admin/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur-sm border-b border-gray-800 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={openMobile}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-white font-semibold text-lg leading-tight">{title}</h1>
            {subtitle && <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {sseStatus && <LiveIndicator status={sseStatus} className="mr-1" />}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}

          <ThemeToggle />

          {/* Notification bell */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => setBellOpen((v) => !v)}
              className={clsx(
                'relative p-2 rounded-lg transition-colors',
                bellOpen
                  ? 'text-indigo-400 bg-indigo-600/10'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              )}
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {newCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {newCount > 9 ? '9+' : newCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                  <p className="text-white text-sm font-semibold">Notifications</p>
                  {newCount > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-full">
                      {newCount} new
                    </span>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-gray-800">
                  {recent.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-600">
                      No recent activity
                    </div>
                  ) : (
                    recent.map((entry) => {
                      const Icon = activityIcon[entry.type] ?? Clock;
                      const color = activityColor[entry.type] ?? 'text-gray-400';
                      const isNew = Date.now() - new Date(entry.timestamp).getTime() < 3_600_000;
                      return (
                        <div
                          key={entry.id}
                          className={clsx(
                            'flex items-start gap-3 px-4 py-3 hover:bg-gray-800/40 transition-colors',
                            isNew && 'bg-indigo-500/5'
                          )}
                        >
                          <div className={clsx('mt-0.5 shrink-0', color)}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-gray-300 text-xs leading-snug truncate">{entry.detail}</p>
                            <p className="text-gray-600 text-xs mt-0.5">
                              {entry.resource} · {timeAgo(entry.timestamp)}
                            </p>
                          </div>
                          {isNew && (
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="px-4 py-2.5 border-t border-gray-800">
                  <a
                    href="/admin"
                    onClick={() => setBellOpen(false)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    View activity feed on dashboard →
                  </a>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

