'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Header from '@/components/admin/Header';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { FormField, Input, Textarea } from '@/components/admin/FormField';
import { ToastContainer, useToast } from '@/components/admin/ToastContainer';
import Badge from '@/components/admin/Badge';
import SortableHeader from '@/components/admin/SortableHeader';
import Pagination from '@/components/admin/Pagination';
import BulkActionBar from '@/components/admin/BulkActionBar';
import ExportButton from '@/components/admin/ExportButton';
import ColumnPicker from '@/components/admin/ColumnPicker';
import InlineEditCell from '@/components/admin/InlineEditCell';
import {
  Search, Users, Pencil, Trash2, CheckCircle, XCircle,
  DollarSign, BookOpen, TrendingUp,
} from 'lucide-react';
import { adminVendors } from '@/lib/api';
import { useSort } from '@/hooks/useSort';
import { usePagination } from '@/hooks/usePagination';
import { useSelection } from '@/hooks/useSelection';
import { useColumnPicker } from '@/hooks/useColumnPicker';
import { useActivity } from '@/context/ActivityContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useGlobalSearch } from '@/context/GlobalSearchContext';
import { useRole } from '@/context/RoleContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vendorSchema, type VendorFormData } from '@/lib/validations';
import type { VendorProfile } from '@/types';

const VENDOR_COLS = [
  { key: 'courses',    label: 'Courses',    defaultVisible: true },
  { key: 'earnings',   label: 'Earnings',   defaultVisible: true },
  { key: 'commission', label: 'Commission', defaultVisible: true },
  { key: 'status',     label: 'Status',     defaultVisible: true },
];

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [search, setSearch] = useState('');
  const [filterApproval, setFilterApproval] = useState<'all' | 'approved' | 'pending'>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<VendorProfile | null>(null);

  const {
    register: registerForm,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: { full_name: '', bio: '', commission_rate: undefined, is_approved: false } as VendorFormData,
  });

  const { toasts, addToast, removeToast } = useToast();
  const { log } = useActivity();
  const debouncedSearch = useDebounce(search, 250);
  const { isVisible: isColVisible, toggleColumn, resetToDefault: resetCols } = useColumnPicker(VENDOR_COLS, 'vendors');
  const { register, unregister } = useGlobalSearch();
  const { can } = useRole();

  useEffect(() => {
    register('vendors', vendors.map((v) => ({
      id: v.id,
      label: v.full_name || v.username,
      description: v.email,
      href: '/admin/vendors',
      type: 'Vendor',
    })));
    return () => unregister('vendors');
  }, [vendors, register, unregister]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    let result = vendors.filter(
      (v) =>
        (v.full_name || '').toLowerCase().includes(q) ||
        v.username.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q)
    );
    if (filterApproval === 'approved') result = result.filter((v) => v.is_approved);
    if (filterApproval === 'pending') result = result.filter((v) => !v.is_approved);
    return result;
  }, [debouncedSearch, filterApproval, vendors]);

  const { sorted, sort, toggle: toggleSort } = useSort(filtered);
  const { paged, page, totalPages, goTo, from, to, total } = usePagination(sorted, 10);
  const selection = useSelection(filtered);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminVendors.list();
      setVendors(data);
    } catch {
      addToast('Failed to load vendors', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (v: VendorProfile) => {
    setSelected(v);
    reset({
      full_name: v.full_name || '',
      bio: v.bio || '',
      commission_rate: v.commission_rate ? Number(v.commission_rate) : undefined,
      is_approved: v.is_approved,
    });
    setEditOpen(true);
  };

  const openDetail = (v: VendorProfile) => {
    setSelected(v);
    setDetailOpen(true);
  };

  const openDelete = (v: VendorProfile) => {
    setSelected(v);
    setDeleteOpen(true);
  };

  const toggleApproval = async (v: VendorProfile) => {
    if (!can('approve')) return;
    try {
      const updated = await adminVendors.update(v.id, { is_approved: !v.is_approved });
      setVendors((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      addToast(`Vendor ${updated.is_approved ? 'approved' : 'unapproved'}`, 'success');
      log(updated.is_approved ? 'approve' : 'reject', 'Vendor', `${updated.is_approved ? 'Approved' : 'Unapproved'} ${updated.full_name || updated.username}`);
    } catch {
      addToast('Failed to update vendor', 'error');
    }
  };

  const handleSave = async (data: VendorFormData) => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await adminVendors.update(selected.id, data);
      setVendors((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      addToast('Vendor updated', 'success');
      log('update', 'Vendor', `Updated ${selected.full_name || selected.username}`);
      setEditOpen(false);
    } catch {
      addToast('Failed to update vendor', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await adminVendors.destroy(selected.id);
      setVendors((prev) => prev.filter((v) => v.id !== selected.id));
      addToast('Vendor deleted', 'success');
      log('delete', 'Vendor', `Deleted ${selected.full_name || selected.username}`);
      setDeleteOpen(false);
    } catch {
      addToast('Failed to delete vendor', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(selection.selected);
    let count = 0;
    for (const id of ids) {
      try {
        await adminVendors.update(id, { is_approved: true });
        count++;
      } catch { /* continue */ }
    }
    setVendors((prev) => prev.map((v) => selection.selected.has(v.id) ? { ...v, is_approved: true } : v));
    selection.clear();
    addToast(`Approved ${count} vendors`, 'success');
    log('approve', 'Vendor', `Bulk approved ${count} vendors`);
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selection.selected);
    let count = 0;
    for (const id of ids) {
      try { await adminVendors.destroy(id); count++; } catch { /* continue */ }
    }
    setVendors((prev) => prev.filter((v) => !selection.selected.has(v.id)));
    selection.clear();
    addToast(`Deleted ${count} vendors`, 'success');
    log('delete', 'Vendor', `Bulk deleted ${count} vendors`);
  };

  const approvedCount = vendors.filter((v) => v.is_approved).length;

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Vendors" subtitle="Manage platform vendors & instructors" onRefresh={load} loading={loading} />

      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-violet-500/10 rounded-lg">
              <Users className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Total Vendors</p>
              <p className="text-white font-bold text-xl">{vendors.length}</p>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Approved</p>
              <p className="text-white font-bold text-xl">{approvedCount}</p>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <XCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Pending Approval</p>
              <p className="text-white font-bold text-xl">{vendors.length - approvedCount}</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vendors..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>
          <div className="flex items-center bg-gray-900 border border-gray-700 rounded-lg p-1 gap-1">
            {(['all', 'approved', 'pending'] as const).map((s) => (
              <button key={s} onClick={() => setFilterApproval(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${filterApproval === s ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                {s}
              </button>
            ))}
          </div>
          <ExportButton data={filtered} filename="vendors" />
          <ColumnPicker columns={VENDOR_COLS} isVisible={isColVisible} onToggle={toggleColumn} onReset={resetCols} />
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <span className="text-gray-500 text-xs">{from}–{to} of {total} vendors</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-5 py-3 w-10">
                    <input type="checkbox" checked={selection.allSelected} onChange={selection.toggleAll}
                      className="rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500" />
                  </th>
                  <SortableHeader label="Vendor" sortKey="full_name" sort={sort} onToggle={toggleSort} className="px-5 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider" />
                  {isColVisible('courses') && <th className="px-5 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">Courses</th>}
                  {isColVisible('earnings') && <SortableHeader label="Earnings" sortKey="total_earnings" sort={sort} onToggle={toggleSort} className="px-5 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider" />}
                  {isColVisible('commission') && <th className="px-5 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">Commission</th>}
                  {isColVisible('status') && <SortableHeader label="Status" sortKey="is_approved" sort={sort} onToggle={toggleSort} className="px-5 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider" />}
                  <th className="px-5 py-3 text-right text-gray-500 font-medium text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td>)}</tr>
                  ))
                ) : paged.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-600">No vendors found</td></tr>
                ) : (
                  paged.map((v) => (
                    <tr key={v.id} className={`hover:bg-gray-800/40 transition-colors group ${selection.isSelected(v.id) ? 'bg-indigo-500/5' : ''}`}>
                      <td className="px-5 py-3.5">
                        <input type="checkbox" checked={selection.isSelected(v.id)} onChange={() => selection.toggle(v.id)}
                          className="rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500" />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-300 text-sm font-bold flex-shrink-0">
                            {(v.full_name || v.username || 'V')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-gray-200 font-medium text-sm">{v.full_name || v.username}</p>
                            <p className="text-gray-500 text-xs">{v.email}</p>
                          </div>
                        </div>
                      </td>
                      {isColVisible('courses') && <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-gray-300"><BookOpen className="w-3.5 h-3.5 text-gray-500" /><span className="font-medium">{v.courses_count}</span></div>
                      </td>}
                      {isColVisible('earnings') && <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 text-emerald-400 font-semibold"><DollarSign className="w-3 h-3" />{v.total_earnings}</div>
                      </td>}
                      {isColVisible('commission') && <td className="px-5 py-3.5">
        <InlineEditCell
          value={v.commission_rate ?? ''}
          type="number"
          placeholder="—"
          disabled={!can('update')}
          onSave={async (val) => {
            const updated = await adminVendors.update(v.id, { commission_rate: val });
            setVendors((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            log('update', 'Vendor', `Set commission to ${val}% for ${v.full_name || v.username}`);
          }}
        />
      </td>}
                      {isColVisible('status') && (
                        <td className="px-5 py-3.5">
                          <button onClick={() => toggleApproval(v)} className="cursor-pointer" title="Toggle approval">
                            <Badge variant={v.is_approved ? 'success' : 'warning'}>{v.is_approved ? 'Approved' : 'Pending'}</Badge>
                          </button>
                        </td>
                      )}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openDetail(v)} className="p-1.5 text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"><TrendingUp className="w-3.5 h-3.5" /></button>
                          {can('update') && <button onClick={() => openEdit(v)} className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>}
                          {can('delete') && <button onClick={() => openDelete(v)} className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
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
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Vendor Details" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-300 text-xl font-bold">
                {(selected.full_name || selected.username || 'V')[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">{selected.full_name || selected.username}</h3>
                <p className="text-gray-400">{selected.email}</p>
                <Badge variant={selected.is_approved ? 'success' : 'warning'} >
                  {selected.is_approved ? 'Approved' : 'Pending'}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Earnings', value: `$${selected.total_earnings}`, color: 'text-emerald-400' },
                { label: 'Commission Amount', value: `$${selected.commission_amount}`, color: 'text-amber-400' },
                { label: 'Commission Rate', value: selected.commission_rate ? `${selected.commission_rate}%` : '—', color: 'text-gray-300' },
                { label: 'Courses', value: selected.courses_count, color: 'text-indigo-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-800 rounded-lg px-4 py-3">
                  <p className="text-gray-500 text-xs">{label}</p>
                  <p className={`font-semibold text-lg ${color}`}>{value}</p>
                </div>
              ))}
            </div>
            {selected.bio && (
              <div className="bg-gray-800 rounded-lg px-4 py-3">
                <p className="text-gray-500 text-xs mb-1">Bio</p>
                <p className="text-gray-300 text-sm">{selected.bio}</p>
              </div>
            )}
            <p className="text-gray-600 text-xs">Member since {new Date(selected.created_at).toLocaleDateString()}</p>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Vendor">
        <div className="space-y-4">
          <FormField label="Full Name" error={errors.full_name?.message}>
            <Input
              {...registerForm('full_name')}
              error={!!errors.full_name}
              placeholder="Vendor full name"
            />
          </FormField>
          <FormField label="Bio" error={errors.bio?.message}>
            <Textarea
              {...registerForm('bio')}
              error={!!errors.bio}
              placeholder="Short bio..."
            />
          </FormField>
          <FormField label="Commission Rate (%)" error={errors.commission_rate?.message}>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...registerForm('commission_rate')}
              error={!!errors.commission_rate}
              placeholder="e.g. 20"
            />
          </FormField>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              onClick={() => setValue('is_approved', !watch('is_approved'))}
              className={`relative w-9 h-5 rounded-full transition-colors ${watch('is_approved') ? 'bg-emerald-600' : 'bg-gray-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${watch('is_approved') ? 'translate-x-4' : ''}`} />
            </div>
            <span className="text-sm text-gray-300">Approved</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditOpen(false)} className="flex-1 px-4 py-2.5 text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit(handleSave)}
              disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Update'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Vendor"
        message={`Delete "${selected?.full_name || selected?.username}"? This cannot be undone.`}
        loading={deleting}
      />

      {/* Bulk Actions */}
      <BulkActionBar count={selection.count} onClear={selection.clear} actions={[
        { label: 'Approve Selected', variant: 'success', onClick: handleBulkApprove },
        { label: 'Delete Selected', variant: 'danger', onClick: handleBulkDelete },
      ]} />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
