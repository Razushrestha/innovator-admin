'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Header from '@/components/admin/Header';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { ToastContainer, useToast } from '@/components/admin/ToastContainer';
import SortableHeader from '@/components/admin/SortableHeader';
import Pagination from '@/components/admin/Pagination';
import BulkActionBar from '@/components/admin/BulkActionBar';
import ExportButton from '@/components/admin/ExportButton';
import DateRangePicker from '@/components/admin/DateRangePicker';
import ColumnPicker from '@/components/admin/ColumnPicker';
import { Search, GraduationCap, Trash2, Eye, Calendar } from 'lucide-react';
import { studentEnrollments } from '@/lib/api';
import { useSort } from '@/hooks/useSort';
import { usePagination } from '@/hooks/usePagination';
import { useSelection } from '@/hooks/useSelection';
import { useColumnPicker } from '@/hooks/useColumnPicker';
import { useActivity } from '@/context/ActivityContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useGlobalSearch } from '@/context/GlobalSearchContext';
import type { Enrollment } from '@/types';

const ENROLLMENT_COLS = [
  { key: 'student',    label: 'Student',    defaultVisible: true },
  { key: 'course',     label: 'Course',     defaultVisible: true },
  { key: 'enrolledAt', label: 'Enrolled At', defaultVisible: true },
];

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Enrollment | null>(null);
  const { toasts, addToast, removeToast } = useToast();
  const { log } = useActivity();
  const debouncedSearch = useDebounce(search, 250);
  const { isVisible: isColVisible, toggleColumn, resetToDefault: resetCols } = useColumnPicker(ENROLLMENT_COLS, 'enrollments');
  const { register, unregister } = useGlobalSearch();

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return enrollments.filter((e) => {
      if (!e.course_title.toLowerCase().includes(q) && !e.student.toLowerCase().includes(q) && !e.course.toLowerCase().includes(q)) return false;
      if (dateFrom && new Date(e.enrolled_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(e.enrolled_at) > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [debouncedSearch, enrollments, dateFrom, dateTo]);

  useEffect(() => {
    register('enrollments', enrollments.map((e) => ({
      id: e.id,
      label: e.course_title,
      description: `Enrolled ${new Date(e.enrolled_at).toLocaleDateString()}`,
      href: '/admin/enrollments',
      type: 'Enrollment',
    })));
    return () => unregister('enrollments');
  }, [enrollments, register, unregister]);

  const { sorted, sort, toggle: toggleSort } = useSort(filtered);
  const { paged, page, totalPages, goTo, from, to, total } = usePagination(sorted, 10);
  const selection = useSelection(filtered);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await studentEnrollments.list();
      setEnrollments(data);
    } catch {
      addToast('Failed to load enrollments', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await studentEnrollments.destroy(selected.id);
      setEnrollments((prev) => prev.filter((e) => e.id !== selected.id));
      addToast('Enrollment deleted', 'success');
      log('delete', 'Enrollment', `Removed enrollment for ${selected?.course_title}`);
      setDeleteOpen(false);
    } catch {
      addToast('Failed to delete enrollment', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selection.selected);
    let count = 0;
    for (const id of ids) {
      try { await studentEnrollments.destroy(id); count++; } catch { /* continue */ }
    }
    setEnrollments((prev) => prev.filter((e) => !selection.selected.has(e.id)));
    selection.clear();
    addToast(`Deleted ${count} enrollments`, 'success');
    log('delete', 'Enrollment', `Bulk deleted ${count} enrollments`);
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Enrollments" subtitle="View all student course enrollments" onRefresh={load} loading={loading} />

      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <GraduationCap className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Total Enrollments</p>
              <p className="text-white font-bold text-xl">{enrollments.length}</p>
            </div>
          </div>
          <div className="bg-gray-900 border border-indigo-500/20 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Calendar className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">This Month</p>
              <p className="text-white font-bold text-xl">
                {enrollments.filter((e) => {
                  const d = new Date(e.enrolled_at);
                  const now = new Date();
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search enrollments..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>
          <DateRangePicker from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} />
          <ExportButton data={filtered} filename="enrollments" />
          <ColumnPicker columns={ENROLLMENT_COLS} isVisible={isColVisible} onToggle={toggleColumn} onReset={resetCols} />
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <span className="text-gray-500 text-xs">{from}–{to} of {total} enrollments</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-5 py-3 w-10">
                    <input type="checkbox" checked={selection.allSelected} onChange={selection.toggleAll}
                      className="rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500" />
                  </th>
                  {isColVisible('student') && <th className="px-5 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">Student</th>}
                  {isColVisible('course') && <SortableHeader label="Course" sortKey="course_title" sort={sort} onToggle={toggleSort} className="px-5 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider" />}
                  {isColVisible('enrolledAt') && <SortableHeader label="Enrolled At" sortKey="enrolled_at" sort={sort} onToggle={toggleSort} className="px-5 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider" />}
                  <th className="px-5 py-3 text-right text-gray-500 font-medium text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td>)}</tr>
                  ))
                ) : paged.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-600">No enrollments found</td></tr>
                ) : (
                  paged.map((e) => (
                    <tr key={e.id} className={`hover:bg-gray-800/40 transition-colors group ${selection.isSelected(e.id) ? 'bg-indigo-500/5' : ''}`}>
                      <td className="px-5 py-3.5">
                        <input type="checkbox" checked={selection.isSelected(e.id)} onChange={() => selection.toggle(e.id)}
                          className="rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500" />
                      </td>
                      {isColVisible('student') && (
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 text-xs font-bold">S</div>
                            <span className="font-mono text-gray-400 text-xs">{e.student.slice(0, 8)}…</span>
                          </div>
                        </td>
                      )}
                      {isColVisible('course') && (
                        <td className="px-5 py-3.5">
                          <p className="text-gray-200 font-medium">{e.course_title}</p>
                          <p className="text-gray-600 text-xs font-mono">{e.course.slice(0, 8)}…</p>
                        </td>
                      )}
                      {isColVisible('enrolledAt') && <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(e.enrolled_at).toLocaleString()}</td>}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setSelected(e); setDetailOpen(true); }} className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { setSelected(e); setDeleteOpen(true); }} className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Enrollment Details" size="sm">
        {selected && (
          <div className="space-y-2">
            {[
              { label: 'Enrollment ID', value: selected.id },
              { label: 'Student ID', value: selected.student },
              { label: 'Course', value: selected.course_title, bold: true },
              { label: 'Course ID', value: selected.course },
              { label: 'Enrolled At', value: new Date(selected.enrolled_at).toLocaleString() },
            ].map(({ label, value, bold }) => (
              <div key={label} className="flex items-start justify-between gap-4 py-2 border-b border-gray-800 last:border-0">
                <span className="text-gray-500 text-xs flex-shrink-0">{label}</span>
                <span className={`text-xs text-right break-all ${bold ? 'text-white font-semibold' : 'text-gray-300'}`}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Enrollment"
        message="Remove this enrollment? The student will lose access."
        loading={deleting}
      />

      <BulkActionBar
        count={selection.count}
        onClear={selection.clear}
        actions={[
          { label: 'Delete Selected', variant: 'danger', onClick: handleBulkDelete },
        ]}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
