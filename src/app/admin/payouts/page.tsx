'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Header from '@/components/admin/Header';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { ToastContainer, useToast } from '@/components/admin/ToastContainer';
import Badge from '@/components/admin/Badge';
import SortableHeader from '@/components/admin/SortableHeader';
import Pagination from '@/components/admin/Pagination';
import BulkActionBar from '@/components/admin/BulkActionBar';
import ExportButton from '@/components/admin/ExportButton';
import DateRangePicker from '@/components/admin/DateRangePicker';
import ColumnPicker from '@/components/admin/ColumnPicker';
import { Search, CreditCard, Clock, CheckCircle, XCircle, Trash2, Eye } from 'lucide-react';
import { vendorPayouts } from '@/lib/api';
import { useSort } from '@/hooks/useSort';
import { usePagination } from '@/hooks/usePagination';
import { useSelection } from '@/hooks/useSelection';
import { useColumnPicker } from '@/hooks/useColumnPicker';
import { useActivity } from '@/context/ActivityContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useGlobalSearch } from '@/context/GlobalSearchContext';
import type { PayoutRequest, StatusEnum } from '@/types';

const PAYOUT_COLS = [
  { key: 'vendor',    label: 'Vendor',    defaultVisible: true },
  { key: 'amount',    label: 'Amount',    defaultVisible: true },
  { key: 'status',    label: 'Status',    defaultVisible: true },
  { key: 'requested', label: 'Requested', defaultVisible: true },
  { key: 'processed', label: 'Processed', defaultVisible: true },
];

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StatusEnum>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<PayoutRequest | null>(null);
  const { toasts, addToast, removeToast } = useToast();
  const { log } = useActivity();
  const debouncedSearch = useDebounce(search, 250);
  const { isVisible: isColVisible, toggleColumn, resetToDefault: resetCols } = useColumnPicker(PAYOUT_COLS, 'payouts');
  const { register, unregister } = useGlobalSearch();

  const filtered = useMemo(() => {
    let result = payouts;
    if (statusFilter !== 'all') result = result.filter((p) => p.status === statusFilter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((p) => p.vendor.toLowerCase().includes(q) || p.amount.includes(q));
    }
    if (dateFrom) result = result.filter((p) => new Date(p.requested_at) >= new Date(dateFrom));
    if (dateTo) result = result.filter((p) => new Date(p.requested_at) <= new Date(dateTo + 'T23:59:59'));
    return result;
  }, [debouncedSearch, statusFilter, payouts, dateFrom, dateTo]);

  useEffect(() => {
    register('payouts', payouts.map((p) => ({
      id: p.id,
      label: `$${p.amount}`,
      description: `${p.status} · ${new Date(p.requested_at).toLocaleDateString()}`,
      href: '/admin/payouts',
      type: 'Payout',
    })));
    return () => unregister('payouts');
  }, [payouts, register, unregister]);

  const { sorted, sort, toggle: toggleSort } = useSort(filtered);
  const { paged, page, totalPages, goTo, from, to, total } = usePagination(sorted, 10);
  const selection = useSelection(filtered);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vendorPayouts.list();
      setPayouts(data);
    } catch {
      addToast('Failed to load payouts', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (payout: PayoutRequest, status: StatusEnum) => {
    try {
      const updated = await vendorPayouts.update(payout.id, { status } as Partial<PayoutRequest>);
      setPayouts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      addToast(`Payout ${status}`, 'success');
      log(status === 'approved' ? 'approve' : 'reject', 'Payout', `${status === 'approved' ? 'Approved' : 'Rejected'} payout $${payout.amount}`);
    } catch {
      addToast('Failed to update payout', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await vendorPayouts.destroy(selected.id);
      setPayouts((prev) => prev.filter((p) => p.id !== selected.id));
      addToast('Payout deleted', 'success');
      log('delete', 'Payout', `Deleted payout $${selected?.amount}`);
      setDeleteOpen(false);
    } catch {
      addToast('Failed to delete payout', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkApprove = async () => {
    const pending = Array.from(selection.selected).filter((id) => payouts.find((p) => p.id === id)?.status === 'pending');
    for (const id of pending) {
      try { const p = payouts.find((x) => x.id === id)!; await vendorPayouts.update(id, { status: 'approved' } as Partial<PayoutRequest>); } catch { /* continue */ }
    }
    setPayouts((prev) => prev.map((p) => selection.selected.has(p.id) && p.status === 'pending' ? { ...p, status: 'approved' as StatusEnum } : p));
    selection.clear();
    addToast(`Approved ${pending.length} payouts`, 'success');
    log('approve', 'Payout', `Bulk approved ${pending.length} payouts`);
  };

  const handleBulkReject = async () => {
    const pending = Array.from(selection.selected).filter((id) => payouts.find((p) => p.id === id)?.status === 'pending');
    for (const id of pending) {
      try { await vendorPayouts.update(id, { status: 'rejected' } as Partial<PayoutRequest>); } catch { /* continue */ }
    }
    setPayouts((prev) => prev.map((p) => selection.selected.has(p.id) && p.status === 'pending' ? { ...p, status: 'rejected' as StatusEnum } : p));
    selection.clear();
    addToast(`Rejected ${pending.length} payouts`, 'success');
    log('reject', 'Payout', `Bulk rejected ${pending.length} payouts`);
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selection.selected);
    let count = 0;
    for (const id of ids) {
      try { await vendorPayouts.destroy(id); count++; } catch { /* continue */ }
    }
    setPayouts((prev) => prev.filter((p) => !selection.selected.has(p.id)));
    selection.clear();
    addToast(`Deleted ${count} payouts`, 'success');
    log('delete', 'Payout', `Bulk deleted ${count} payouts`);
  };

  const pending = payouts.filter((p) => p.status === 'pending').length;
  const approved = payouts.filter((p) => p.status === 'approved').length;
  const totalApproved = payouts
    .filter((p) => p.status === 'approved')
    .reduce((s, p) => s + parseFloat(p.amount || '0'), 0)
    .toFixed(2);

  const statusBadge = (s: StatusEnum) => {
    const map = { pending: 'warning', approved: 'success', rejected: 'danger' } as const;
    return <Badge variant={map[s]}>{s}</Badge>;
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Payouts" subtitle="Manage vendor payout requests" onRefresh={load} loading={loading} />

      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Pending</p>
              <p className="text-white font-bold text-xl">{pending}</p>
            </div>
          </div>
          <div className="bg-gray-900 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Approved</p>
              <p className="text-white font-bold text-xl">{approved}</p>
            </div>
          </div>
          <div className="bg-gray-900 border border-indigo-500/20 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <CreditCard className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Total Paid Out</p>
              <p className="text-white font-bold text-xl">${totalApproved}</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search payouts..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>
          <div className="flex items-center bg-gray-900 border border-gray-700 rounded-lg p-1 gap-1">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${statusFilter === s ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                {s}
              </button>
            ))}
          </div>
          <ExportButton data={filtered} filename="payouts" />
          <DateRangePicker from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} />
          <ColumnPicker columns={PAYOUT_COLS} isVisible={isColVisible} onToggle={toggleColumn} onReset={resetCols} />
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <span className="text-gray-500 text-xs">{from}–{to} of {total} payouts</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-5 py-3 w-10">
                    <input type="checkbox" checked={selection.allSelected} onChange={selection.toggleAll}
                      className="rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500" />
                  </th>
                  {isColVisible('vendor') && <th className="px-5 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">Vendor</th>}
                  {isColVisible('amount') && <SortableHeader label="Amount" sortKey="amount" sort={sort} onToggle={toggleSort} className="px-5 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider" />}
                  {isColVisible('status') && <SortableHeader label="Status" sortKey="status" sort={sort} onToggle={toggleSort} className="px-5 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider" />}
                  {isColVisible('requested') && <SortableHeader label="Requested" sortKey="requested_at" sort={sort} onToggle={toggleSort} className="px-5 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider" />}
                  {isColVisible('processed') && <th className="px-5 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">Processed</th>}
                  <th className="px-5 py-3 text-right text-gray-500 font-medium text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td>)}</tr>
                  ))
                ) : paged.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-600">No payouts found</td></tr>
                ) : (
                  paged.map((p) => (
                    <tr key={p.id} className={`hover:bg-gray-800/40 transition-colors group ${selection.isSelected(p.id) ? 'bg-indigo-500/5' : ''}`}>
                      <td className="px-5 py-3.5">
                        <input type="checkbox" checked={selection.isSelected(p.id)} onChange={() => selection.toggle(p.id)}
                          className="rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500" />
                      </td>
                      {isColVisible('vendor') && <td className="px-5 py-3.5 font-mono text-gray-400 text-xs">{p.vendor.slice(0, 8)}…</td>}
                      {isColVisible('amount') && <td className="px-5 py-3.5 text-white font-bold text-base">${p.amount}</td>}
                      {isColVisible('status') && <td className="px-5 py-3.5">{statusBadge(p.status)}</td>}
                      {isColVisible('requested') && <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(p.requested_at).toLocaleString()}</td>}
                      {isColVisible('processed') && <td className="px-5 py-3.5 text-gray-500 text-xs">{p.processed_at ? new Date(p.processed_at).toLocaleString() : '—'}</td>}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {p.status === 'pending' && (
                            <>
                              <button onClick={() => updateStatus(p, 'approved')} className="p-1.5 text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Approve"><CheckCircle className="w-3.5 h-3.5" /></button>
                              <button onClick={() => updateStatus(p, 'rejected')} className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors" title="Reject"><XCircle className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                          <button onClick={() => { setSelected(p); setDetailOpen(true); }} className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { setSelected(p); setDeleteOpen(true); }} className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && <div className="px-5 py-3 border-t border-gray-800"><Pagination page={page} totalPages={totalPages} onGoTo={goTo} /></div>}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Payout Details" size="sm">
        {selected && (
          <div className="space-y-3">
            {[
              { label: 'Payout ID', value: selected.id },
              { label: 'Vendor ID', value: selected.vendor },
              { label: 'Amount', value: `$${selected.amount}`, bold: true },
              { label: 'Status', value: selected.status.toUpperCase() },
              { label: 'Requested At', value: new Date(selected.requested_at).toLocaleString() },
              { label: 'Processed At', value: selected.processed_at ? new Date(selected.processed_at).toLocaleString() : '—' },
            ].map(({ label, value, bold }) => (
              <div key={label} className="flex items-start justify-between gap-4 py-2 border-b border-gray-800 last:border-0">
                <span className="text-gray-500 text-xs flex-shrink-0">{label}</span>
                <span className={`text-xs text-right break-all ${bold ? 'text-white font-bold text-sm' : 'text-gray-300'}`}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Payout"
        message="Delete this payout request? This cannot be undone."
        loading={deleting}
      />

      {/* Bulk Actions */}
      <BulkActionBar count={selection.count} onClear={selection.clear} actions={[
        { label: 'Approve Selected', variant: 'success', onClick: handleBulkApprove },
        { label: 'Reject Selected', variant: 'warning', onClick: handleBulkReject },
        { label: 'Delete Selected', variant: 'danger', onClick: handleBulkDelete },
      ]} />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
