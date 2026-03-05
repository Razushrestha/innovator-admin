'use client';

import { useMemo, useState } from 'react';
import Header from '@/components/admin/Header';
import { ToastContainer, useToast } from '@/components/admin/ToastContainer';
import Pagination from '@/components/admin/Pagination';
import { useActivity, type ActivityEntry } from '@/context/ActivityContext';
import { usePagination } from '@/hooks/usePagination';
import {
  ShieldCheck, Trash2, Pencil, Plus, CheckCircle, XCircle,
  LogIn, Info, Filter, Download, RotateCcw,
} from 'lucide-react';
import clsx from 'clsx';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<ActivityEntry['type'], React.ElementType> = {
  create:  Plus,
  update:  Pencil,
  delete:  Trash2,
  approve: CheckCircle,
  reject:  XCircle,
  login:   LogIn,
  info:    Info,
};

const TYPE_COLOR: Record<ActivityEntry['type'], string> = {
  create:  'text-emerald-400 bg-emerald-500/10',
  update:  'text-indigo-400  bg-indigo-500/10',
  delete:  'text-rose-400    bg-rose-500/10',
  approve: 'text-emerald-400 bg-emerald-500/10',
  reject:  'text-rose-400    bg-rose-500/10',
  login:   'text-blue-400    bg-blue-500/10',
  info:    'text-gray-400    bg-gray-800',
};

const TYPE_LABELS: Array<{ value: '' | ActivityEntry['type']; label: string }> = [
  { value: '',        label: 'All Types' },
  { value: 'create',  label: 'Create'   },
  { value: 'update',  label: 'Update'   },
  { value: 'delete',  label: 'Delete'   },
  { value: 'approve', label: 'Approve'  },
  { value: 'reject',  label: 'Reject'   },
  { value: 'login',   label: 'Login'    },
  { value: 'info',    label: 'Info'     },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const PAGE_SIZE = 20;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const { activities, clear } = useActivity();
  const { addToast, toasts, removeToast } = useToast();

  const [typeFilter, setTypeFilter] = useState<'' | ActivityEntry['type']>('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Unique resource names for the dropdown
  const resources = useMemo(() => {
    const set = new Set(activities.map((a) => a.resource).filter(Boolean));
    return Array.from(set).sort();
  }, [activities]);

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (typeFilter && a.type !== typeFilter) return false;
      if (resourceFilter && a.resource !== resourceFilter) return false;
      if (dateFrom && new Date(a.timestamp) < new Date(dateFrom)) return false;
      if (dateTo && new Date(a.timestamp) > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [activities, typeFilter, resourceFilter, dateFrom, dateTo]);

  const { paged: paginated, page: currentPage, goTo: setCurrentPage, totalPages } = usePagination(filtered, PAGE_SIZE);

  const isFiltered = typeFilter || resourceFilter || dateFrom || dateTo;

  const resetFilters = () => {
    setTypeFilter('');
    setResourceFilter('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  // ── CSV export ──────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const rows = [
      ['Timestamp', 'Type', 'Action', 'Resource', 'Detail'],
      ...filtered.map((a) => [
        a.timestamp, a.type, a.action, a.resource, a.detail,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    addToast('Audit log exported', 'success');
  };

  const handleClear = () => {
    if (!window.confirm('Clear all audit log entries? This cannot be undone.')) return;
    clear();
    addToast('Audit log cleared', 'warning');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-950">
      <Header
        title="Audit Log"
        subtitle={`${filtered.length} events${isFiltered ? ' (filtered)' : ''} — stored in browser`}
      />

      <div className="flex-1 p-4 lg:p-6 space-y-4">
        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as ActivityEntry['type'] | ''); setCurrentPage(1); }}
            className="bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {TYPE_LABELS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Resource filter */}
          <select
            value={resourceFilter}
            onChange={(e) => { setResourceFilter(e.target.value); setCurrentPage(1); }}
            className="bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Resources</option>
            {resources.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>

          {/* Date range */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
            className="bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="From date"
          />
          <span className="text-gray-600 text-sm">–</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
            className="bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="To date"
          />

          {isFiltered && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={exportCSV}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={handleClear}
              disabled={activities.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-rose-900/40 hover:bg-rose-900/70 text-rose-300 rounded-lg transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Log
            </button>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['create', 'update', 'delete', 'approve'] as const).map((type) => {
            const count = activities.filter((a) => a.type === type).length;
            const Icon = TYPE_ICON[type];
            return (
              <button
                key={type}
                onClick={() => { setTypeFilter(typeFilter === type ? '' : type); setCurrentPage(1); }}
                className={clsx(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all',
                  typeFilter === type
                    ? 'border-indigo-500/50 bg-indigo-900/20'
                    : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                )}
              >
                <span className={clsx('p-1.5 rounded-lg', TYPE_COLOR[type])}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <div className="text-left">
                  <p className="text-white font-semibold text-sm">{count}</p>
                  <p className="text-gray-500 text-xs capitalize">{type}s</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Table ── */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <ShieldCheck className="w-10 h-10 text-gray-700" />
              <p className="text-gray-500">
                {isFiltered ? 'No events match the current filters.' : 'No activity recorded yet.'}
              </p>
              {isFiltered && (
                <button onClick={resetFilters} className="text-indigo-400 hover:underline text-sm">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-900/80">
                      <th className="px-4 py-3 text-left text-gray-400 font-medium whitespace-nowrap">Type</th>
                      <th className="px-4 py-3 text-left text-gray-400 font-medium whitespace-nowrap">Action</th>
                      <th className="px-4 py-3 text-left text-gray-400 font-medium whitespace-nowrap">Resource</th>
                      <th className="px-4 py-3 text-left text-gray-400 font-medium whitespace-nowrap">Detail</th>
                      <th className="px-4 py-3 text-right text-gray-400 font-medium whitespace-nowrap">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {paginated.map((entry: ActivityEntry) => {
                      const Icon = TYPE_ICON[entry.type];
                      return (
                        <tr key={entry.id} className="hover:bg-gray-800/30 transition-colors group">
                          <td className="px-4 py-3">
                            <span className={clsx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', TYPE_COLOR[entry.type])}>
                              <Icon className="w-3 h-3" />
                              {entry.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-200 capitalize whitespace-nowrap">{entry.action}</td>
                          <td className="px-4 py-3">
                            <span className="text-indigo-400 text-xs font-medium bg-indigo-900/20 px-2 py-0.5 rounded-full">
                              {entry.resource || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{entry.detail || '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className="text-gray-500 text-xs"
                              title={formatDate(entry.timestamp)}
                            >
                              {relativeTime(entry.timestamp)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-800">
                  <Pagination
                    page={currentPage}
                    totalPages={totalPages}
                    onGoTo={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
