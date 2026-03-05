'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, FolderOpen, Users,
  GraduationCap, CreditCard, Settings, Search, Hash, Clock, Database,
} from 'lucide-react';
import clsx from 'clsx';
import { useActivity } from '@/context/ActivityContext';
import { useGlobalSearch } from '@/context/GlobalSearchContext';

interface CommandItem {
  id: string;
  type: 'page' | 'activity' | 'record';
  label: string;
  description?: string;
  href?: string;
  icon: React.ElementType;
  badge?: string;
}

const PAGE_ROUTES: CommandItem[] = [
  { id: 'dashboard', type: 'page', label: 'Dashboard', description: 'Overview & live stats', href: '/admin', icon: LayoutDashboard },
  { id: 'courses', type: 'page', label: 'Courses', description: 'Create, edit, publish courses', href: '/admin/courses', icon: BookOpen },
  { id: 'categories', type: 'page', label: 'Categories', description: 'Manage course categories', href: '/admin/categories', icon: FolderOpen },
  { id: 'vendors', type: 'page', label: 'Vendors', description: 'Review & approve vendors', href: '/admin/vendors', icon: Users },
  { id: 'enrollments', type: 'page', label: 'Enrollments', description: 'Student enrollment records', href: '/admin/enrollments', icon: GraduationCap },
  { id: 'payouts', type: 'page', label: 'Payouts', description: 'Approve vendor payouts', href: '/admin/payouts', icon: CreditCard },
  { id: 'settings', type: 'page', label: 'Settings', description: 'Account & preferences', href: '/admin/settings', icon: Settings },
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  Course: BookOpen,
  Category: FolderOpen,
  Vendor: Users,
  Enrollment: GraduationCap,
  Payout: CreditCard,
};

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { activities } = useActivity();
  const globalSearch = useGlobalSearch();
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build activity items
  const activityItems: CommandItem[] = activities.slice(0, 5).map((a) => ({
    id: `act-${a.id}`,
    type: 'activity',
    label: a.detail,
    description: `${a.resource} · ${new Date(a.timestamp).toLocaleTimeString()}`,
    icon: Clock,
  }));

  // Build global record search results (only when query is present)
  const recordItems: CommandItem[] = query.trim()
    ? globalSearch.search(query).map((r) => ({
        id: `rec-${r.type}-${r.id}`,
        type: 'record',
        label: r.label,
        description: r.description,
        href: r.href,
        icon: TYPE_ICONS[r.type] ?? Database,
        badge: r.type,
      }))
    : [];

  const baseItems = [...PAGE_ROUTES, ...activityItems];

  const filteredBase = query.trim()
    ? baseItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase())
      )
    : baseItems;

  // Combined list for keyboard navigation
  const filtered = [...filteredBase, ...recordItems];

  const execute = useCallback(
    (item: CommandItem) => {
      if (item.href) {
        router.push(item.href);
      }
      onClose();
    },
    [router, onClose]
  );

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[activeIdx]) execute(filtered[activeIdx]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filtered, activeIdx, execute, onClose]);

  // Keep active item visible
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  // Reset active idx on query change
  useEffect(() => { setActiveIdx(0); }, [query]);

  if (!open) return null;

  const pages = filteredBase.filter((i) => i.type === 'page');
  const recent = filteredBase.filter((i) => i.type === 'activity');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[201] w-full max-w-lg px-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-800">
            <Search className="w-4 h-4 text-gray-500 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, records, or activity…"
              className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none"
            />
            <kbd className="hidden sm:block text-xs text-gray-600 border border-gray-700 rounded px-1.5 py-0.5">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-96 overflow-y-auto py-2">
            {filtered.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-gray-600">No results for &ldquo;{query}&rdquo;</p>
            )}

            {pages.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-xs text-gray-600 font-medium uppercase tracking-wider">Pages</p>
                {pages.map((item) => {
                  const globalIdx = filtered.indexOf(item);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      data-idx={globalIdx}
                      onClick={() => execute(item)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        activeIdx === globalIdx ? 'bg-indigo-600/20 text-white' : 'text-gray-300 hover:bg-gray-800/60'
                      )}
                    >
                      <div className={clsx(
                        'p-1.5 rounded-lg shrink-0',
                        activeIdx === globalIdx ? 'bg-indigo-600/30' : 'bg-gray-800'
                      )}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 truncate">{item.description}</p>
                        )}
                      </div>
                      {activeIdx === globalIdx && (
                        <kbd className="ml-auto text-xs text-gray-500 border border-gray-700 rounded px-1.5 py-0.5 shrink-0">
                          ↵
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {recent.length > 0 && (
              <div className="mt-1">
                <p className="px-4 py-1.5 text-xs text-gray-600 font-medium uppercase tracking-wider">Recent Activity</p>
                {recent.map((item) => {
                  const globalIdx = filtered.indexOf(item);
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      data-idx={globalIdx}
                      className="flex items-center gap-3 px-4 py-2.5 text-gray-500"
                    >
                      <div className="p-1.5 rounded-lg bg-gray-800/60 shrink-0">
                        <Icon className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 truncate">{item.label}</p>
                        {item.description && (
                          <p className="text-xs text-gray-600 truncate">{item.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {recordItems.length > 0 && (
              <div className="mt-1">
                <p className="px-4 py-1.5 text-xs text-gray-600 font-medium uppercase tracking-wider">Records</p>
                {recordItems.map((item) => {
                  const globalIdx = filtered.indexOf(item);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      data-idx={globalIdx}
                      onClick={() => execute(item)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        activeIdx === globalIdx ? 'bg-indigo-600/20 text-white' : 'text-gray-300 hover:bg-gray-800/60'
                      )}
                    >
                      <div className={clsx(
                        'p-1.5 rounded-lg shrink-0',
                        activeIdx === globalIdx ? 'bg-indigo-600/30' : 'bg-gray-800'
                      )}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 truncate">{item.description}</p>
                        )}
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 bg-gray-800 text-gray-500 rounded text-xs font-mono shrink-0">
                          {item.badge}
                        </span>
                      )}
                      {activeIdx === globalIdx && (
                        <kbd className="ml-1 text-xs text-gray-500 border border-gray-700 rounded px-1.5 py-0.5 shrink-0">
                          ↵
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2.5 border-t border-gray-800 flex items-center gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> Navigate with ↑ ↓</span>
            <span>Enter to open</span>
            <span className="ml-auto flex items-center gap-2">
              <span>Ctrl+K to toggle</span>
              <span>·</span>
              <span>Ctrl+/ for shortcuts</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}






