'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Header from '@/components/admin/Header';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { FormField, Input, Textarea } from '@/components/admin/FormField';
import { ToastContainer, useToast } from '@/components/admin/ToastContainer';
import SortableHeader from '@/components/admin/SortableHeader';
import Pagination from '@/components/admin/Pagination';
import BulkActionBar from '@/components/admin/BulkActionBar';
import ExportButton from '@/components/admin/ExportButton';
import ImportButton from '@/components/admin/ImportButton';
import ColumnPicker from '@/components/admin/ColumnPicker';
import InlineEditCell from '@/components/admin/InlineEditCell';
import { Plus, Pencil, Trash2, Search, FolderOpen } from 'lucide-react';
import { adminCategories } from '@/lib/api';
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
import { categorySchema, type CategoryFormData } from '@/lib/validations';
import type { Category } from '@/types';

const empty = { name: '', description: '' };
const PAGE_SIZE = 10;

const CATEGORY_COLS = [
  { key: 'description', label: 'Description', defaultVisible: true },
  { key: 'created',     label: 'Created',     defaultVisible: true },
];

const CSV_COLUMNS = [
  { key: 'name',        label: 'Name',        required: true },
  { key: 'description', label: 'Description', required: false },
];

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Category | null>(null);
  const {
    register: registerForm,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: empty,
  });

  const { toasts, addToast, removeToast } = useToast();
  const { log } = useActivity();
  const debouncedSearch = useDebounce(search, 250);
  const { isVisible: isColVisible, toggleColumn, resetToDefault: resetCols } = useColumnPicker(CATEGORY_COLS, 'categories');
  const { register, unregister } = useGlobalSearch();
  const { can } = useRole();

  useEffect(() => {
    register('categories', items.map((c) => ({
      id: c.id,
      label: c.name,
      description: c.description || '',
      href: '/admin/categories',
      type: 'Category',
    })));
    return () => unregister('categories');
  }, [items, register, unregister]);

  const handleCsvImport = async (rows: Record<string, string>[]): Promise<string[]> => {
    const errors: string[] = [];
    for (const row of rows) {
      const name = row.name || row.Name;
      if (!name?.trim()) { errors.push(`Row missing name: ${JSON.stringify(row)}`); continue; }
      try {
        const created = await adminCategories.create({
          name: name.trim(),
          description: (row.description || row.Description || '').trim(),
        });
        setItems((prev) => [created, ...prev]);
        log('create', 'Category', `Imported "${created.name}"`);
      } catch {
        errors.push(`Failed to import "${name}"`);
      }
    }
    if (errors.length === 0) addToast(`Imported ${rows.length} categories`, 'success');
    return errors;
  };

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q));
  }, [debouncedSearch, items]);

  const { sorted, sort, toggle: toggleSort } = useSort(filtered);
  const { paged, page, totalPages, goTo, from, to, total } = usePagination(sorted, PAGE_SIZE);
  const selection = useSelection(filtered);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminCategories.list();
      setItems(data);
    } catch {
      addToast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setSelected(null);
    reset(empty);
    setModalOpen(true);
  };

  const openEdit = (item: Category) => {
    setSelected(item);
    reset({ name: item.name, description: item.description || '' });
    setModalOpen(true);
  };

  const openDelete = (item: Category) => {
    setSelected(item);
    setDeleteOpen(true);
  };

  const handleSave = async (data: CategoryFormData) => {
    setSaving(true);
    try {
      if (selected) {
        const updated = await adminCategories.update(selected.id, data);
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        addToast('Category updated', 'success');
        log('update', 'Category', `Updated "${updated.name}"`);
      } else {
        const created = await adminCategories.create(data);
        setItems((prev) => [created, ...prev]);
        addToast('Category created', 'success');
        log('create', 'Category', `Created "${created.name}"`);
      }
      setModalOpen(false);
    } catch {
      addToast('Failed to save category', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await adminCategories.destroy(selected.id);
      setItems((prev) => prev.filter((i) => i.id !== selected.id));
      addToast('Category deleted', 'success');
      log('delete', 'Category', `Deleted "${selected.name}"`);
      setDeleteOpen(false);
    } catch {
      addToast('Failed to delete category', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selection.selected);
    let count = 0;
    for (const id of ids) {
      try {
        await adminCategories.destroy(id);
        count++;
      } catch { /* continue */ }
    }
    setItems((prev) => prev.filter((i) => !selection.selected.has(i.id)));
    selection.clear();
    addToast(`Deleted ${count} categories`, 'success');
    log('delete', 'Category', `Bulk deleted ${count} categories`);
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Categories" subtitle="Manage course categories" onRefresh={load} loading={loading} />

      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <ExportButton data={filtered} filename="categories" />
            <ImportButton columns={CSV_COLUMNS} onImport={handleCsvImport} label="Import CSV" />
            <ColumnPicker columns={CATEGORY_COLS} isVisible={isColVisible} onToggle={toggleColumn} onReset={resetCols} />
            {can('create') && (
              <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
                <Plus className="w-4 h-4" /> Add Category
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-gray-500" />
            <span className="text-gray-500 text-xs">{from}–{to} of {total} {total === 1 ? 'category' : 'categories'}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-5 py-3 w-10">
                    <input type="checkbox" checked={selection.allSelected} onChange={selection.toggleAll}
                      className="rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500" />
                  </th>
                  <SortableHeader label="Name" sortKey="name" sort={sort} onToggle={toggleSort} className="px-5 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider" />
                  {isColVisible('description') && <th className="px-5 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">Description</th>}
                  {isColVisible('created') && <SortableHeader label="Created" sortKey="created_at" sort={sort} onToggle={toggleSort} className="px-5 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider" />}
                  <th className="px-5 py-3 text-right text-gray-500 font-medium text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td>)}</tr>
                  ))
                ) : paged.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-600">No categories found</td></tr>
                ) : (
                  paged.map((cat) => (
                    <tr key={cat.id} className={`hover:bg-gray-800/40 transition-colors group ${selection.isSelected(cat.id) ? 'bg-indigo-500/5' : ''}`}>
                      <td className="px-5 py-3.5">
                        <input type="checkbox" checked={selection.isSelected(cat.id)} onChange={() => selection.toggle(cat.id)}
                          className="rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500" />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
                            <FolderOpen className="w-3.5 h-3.5" />
                          </div>
                          <InlineEditCell
                            value={cat.name}
                            disabled={!can('update')}
                            onSave={async (val) => {
                              const updated = await adminCategories.update(cat.id, { name: val });
                              setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
                              log('update', 'Category', `Renamed to "${updated.name}"`);
                            }}
                            className="text-gray-200 font-medium"
                          />
                        </div>
                      </td>
                      {isColVisible('description') && (
                        <td className="px-5 py-3.5 text-gray-500 max-w-xs truncate">
                          {cat.description || <span className="text-gray-700 italic">No description</span>}
                        </td>
                      )}
                      {isColVisible('created') && <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(cat.created_at).toLocaleDateString()}</td>}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {can('update') && <button onClick={() => openEdit(cat)} className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>}
                          {can('delete') && <button onClick={() => openDelete(cat)} className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
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

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Category' : 'New Category'}>
        <div className="space-y-4">
          <FormField label="Name" required error={errors.name?.message}>
            <Input
              {...registerForm('name')}
              error={!!errors.name}
              placeholder="e.g. Web Development"
            />
          </FormField>
          <FormField label="Description" error={errors.description?.message}>
            <Textarea
              {...registerForm('description')}
              error={!!errors.description}
              placeholder="Brief description..."
            />
          </FormField>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
            <button
              onClick={handleSubmit(handleSave)}
              disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : selected ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete}
        title="Delete Category" message={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`} loading={deleting} />

      {/* Bulk Actions */}
      <BulkActionBar count={selection.count} onClear={selection.clear} actions={[
        { label: 'Delete Selected', variant: 'danger', onClick: handleBulkDelete },
      ]} />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}


