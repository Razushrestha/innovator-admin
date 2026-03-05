'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Header from '@/components/admin/Header';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { FormField, Input, Select } from '@/components/admin/FormField';
import { ToastContainer, useToast } from '@/components/admin/ToastContainer';
import Badge from '@/components/admin/Badge';
import SortableHeader from '@/components/admin/SortableHeader';
import Pagination from '@/components/admin/Pagination';
import BulkActionBar from '@/components/admin/BulkActionBar';
import ExportButton from '@/components/admin/ExportButton';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ColumnPicker from '@/components/admin/ColumnPicker';
import {
  Plus, Pencil, Trash2, Search, BookOpen,
  PlayCircle, FileText, Eye, ImageIcon, X, GripVertical,
} from 'lucide-react';
import { adminCourses, adminCategories, adminCourseContents, adminVendors, uploadCourseThumbnail } from '@/lib/api';
import { useSort } from '@/hooks/useSort';
import { usePagination } from '@/hooks/usePagination';
import { useSelection } from '@/hooks/useSelection';
import { useColumnPicker } from '@/hooks/useColumnPicker';
import { useActivity } from '@/context/ActivityContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useGlobalSearch } from '@/context/GlobalSearchContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { courseSchema, courseContentSchema, type CourseFormData, type CourseContentFormData } from '@/lib/validations';
import type { AdminCourse, Category, CourseContent, VendorProfile } from '@/types';

const emptyCourse = { title: '', description: '', price: 0, category: '', vendor: '', is_published: false };
const emptyContent = { title: '', video_url: '', document_url: '', course_level: '', order: 0 };
const PAGE_SIZE = 10;

const COURSE_COLS = [
  { key: 'category', label: 'Category', defaultVisible: true },
  { key: 'price',    label: 'Price',    defaultVisible: true },
  { key: 'status',   label: 'Status',   defaultVisible: true },
  { key: 'created',  label: 'Created',  defaultVisible: true },
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [contentsOpen, setContentsOpen] = useState(false);
  const [contentModalOpen, setContentModalOpen] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState<AdminCourse | null>(null);
  const [selectedContent, setSelectedContent] = useState<CourseContent | null>(null);
  const [contents, setContents] = useState<CourseContent[]>([]);
  const [loadingContents, setLoadingContents] = useState(false);

  const {
    register: registerCourse,
    handleSubmit: handleSubmitCourse,
    reset: resetCourse,
    formState: { errors: courseErrors },
    setValue: setCourseValue,
    watch: watchCourse,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: emptyCourse as CourseFormData,
  });

  const {
    register: registerContent,
    handleSubmit: handleSubmitContent,
    reset: resetContent,
    formState: { errors: contentErrors },
  } = useForm<CourseContentFormData>({
    resolver: zodResolver(courseContentSchema),
    defaultValues: emptyContent as CourseContentFormData,
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');

  const { toasts, addToast, removeToast } = useToast();
  const { log } = useActivity();
  const debouncedSearch = useDebounce(search, 250);
  const { isVisible: isColVisible, toggleColumn, resetToDefault: resetCols } = useColumnPicker(COURSE_COLS, 'courses');

  // Drag-and-drop state refs for content reordering
  const dragItemId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Global record search registration
  const { register, unregister } = useGlobalSearch();
  useEffect(() => {
    register('courses', courses.map((c) => ({
      id: c.id,
      label: c.title,
      description: `$${c.price} · ${c.is_published ? 'Published' : 'Draft'}`,
      href: '/admin/courses',
      type: 'Course',
    })));
    return () => unregister('courses');
  }, [courses, register, unregister]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    let result = courses.filter(
      (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
    if (filterStatus === 'published') result = result.filter((c) => c.is_published);
    if (filterStatus === 'draft') result = result.filter((c) => !c.is_published);
    return result;
  }, [debouncedSearch, filterStatus, courses]);

  const { sorted, sort, toggle: toggleSort } = useSort(filtered);
  const { paged, page, totalPages, goTo, from, to, total } = usePagination(sorted, PAGE_SIZE);
  const selection = useSelection(filtered);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, cat, v] = await Promise.all([adminCourses.list(), adminCategories.list(), adminVendors.list()]);
      setCourses(c);
      setCategories(cat);
      setVendors(v);
    } catch {
      addToast('Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setSelectedCourse(null);
    resetCourse(emptyCourse as CourseFormData);
    setThumbnailFile(null);
    setThumbnailPreview('');
    setCourseModalOpen(true);
  };

  const openEdit = (course: AdminCourse) => {
    setSelectedCourse(course);
    resetCourse({
      title: course.title,
      description: course.description || '',
      price: Number(course.price),
      category: course.category || '',
      vendor: course.vendor || '',
      is_published: course.is_published ?? false,
    });
    setThumbnailFile(null);
    setThumbnailPreview(course.thumbnail || '');
    setCourseModalOpen(true);
  };

  const openDelete = (course: AdminCourse) => {
    setSelectedCourse(course);
    setDeleteOpen(true);
  };

  const openContents = async (course: AdminCourse) => {
    setSelectedCourse(course);
    setContentsOpen(true);
    setLoadingContents(true);
    try {
      const data = await adminCourseContents.list(course.id);
      setContents(data);
    } catch {
      addToast('Failed to load contents', 'error');
    } finally {
      setLoadingContents(false);
    }
  };

  const handleSaveCourse = async (data: CourseFormData) => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: data.title,
        description: data.description,
        price: data.price,
        is_published: data.is_published,
        category: data.category || null,
      };
      if (data.vendor) payload.vendor = data.vendor;
      let result: AdminCourse;
      if (selectedCourse) {
        result = await adminCourses.update(selectedCourse.id, payload);
        setCourses((prev) => prev.map((c) => (c.id === result.id ? result : c)));
        addToast('Course updated', 'success');
        log('update', 'Course', `Updated "${data.title}"`);
      } else {
        result = await adminCourses.create(payload);
        setCourses((prev) => [result, ...prev]);
        addToast('Course created', 'success');
        log('create', 'Course', `Created "${result.title}"`);
      }
      // Upload thumbnail if a file was selected
      if (thumbnailFile) {
        try {
          const updated = await uploadCourseThumbnail(result.id, thumbnailFile);
          setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        } catch {
          addToast('Course saved but thumbnail upload failed', 'warning');
        }
      }
      setCourseModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save course';
      // Try to extract a readable field error from JSON
      try {
        const parsed = JSON.parse(msg);
        const firstKey = Object.keys(parsed)[0];
        const firstVal = Array.isArray(parsed[firstKey]) ? parsed[firstKey][0] : parsed[firstKey];
        addToast(`${firstKey}: ${firstVal}`, 'error');
      } catch {
        addToast(msg.slice(0, 120), 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    setDeleting(true);
    try {
      await adminCourses.destroy(selectedCourse.id);
      setCourses((prev) => prev.filter((c) => c.id !== selectedCourse.id));
      addToast('Course deleted', 'success');
      log('delete', 'Course', `Deleted "${selectedCourse?.title}"`);
      setDeleteOpen(false);
    } catch {
      addToast('Failed to delete course', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const openAddContent = () => {
    setSelectedContent(null);
    resetContent(emptyContent as CourseContentFormData);
    setContentModalOpen(true);
  };

  const openEditContent = (c: CourseContent) => {
    setSelectedContent(c);
    resetContent({
      title: c.title,
      video_url: c.video_url || '',
      document_url: c.document_url || '',
      course_level: c.course_level || '',
      order: c.order,
    });
    setContentModalOpen(true);
  };

  const handleSaveContent = async (data: CourseContentFormData) => {
    if (!selectedCourse) return;
    setSaving(true);
    try {
      const payload = {
        ...data,
        video_url: data.video_url || null,
        document_url: data.document_url || null,
        course_level: data.course_level || null,
      };
      if (selectedContent) {
        const updated = await adminCourseContents.update(selectedCourse.id, selectedContent.id, payload);
        setContents((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        addToast('Content updated', 'success');
      } else {
        const created = await adminCourseContents.create(selectedCourse.id, payload);
        setContents((prev) => [...prev, created]);
        addToast('Content added', 'success');
      }
      setContentModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save content';
      try {
        const parsed = JSON.parse(msg);
        const firstKey = Object.keys(parsed)[0];
        const firstVal = Array.isArray(parsed[firstKey]) ? parsed[firstKey][0] : parsed[firstKey];
        addToast(`${firstKey}: ${firstVal}`, 'error');
      } catch {
        addToast(msg.slice(0, 120), 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selection.selected);
    let count = 0;
    for (const id of ids) {
      try { await adminCourses.destroy(id); count++; } catch { /* continue */ }
    }
    setCourses((prev) => prev.filter((c) => !selection.selected.has(c.id)));
    selection.clear();
    addToast(`Deleted ${count} courses`, 'success');
    log('delete', 'Course', `Bulk deleted ${count} courses`);
  };

  const handleDeleteContent = async (content: CourseContent) => {
    if (!selectedCourse) return;
    try {
      await adminCourseContents.destroy(selectedCourse.id, content.id);
      setContents((prev) => prev.filter((c) => c.id !== content.id));
      addToast('Content deleted', 'success');
    } catch {
      addToast('Failed to delete content', 'error');
    }
  };

  const handleContentDrop = useCallback(async (targetId: string) => {
    if (!dragItemId.current || !selectedCourse || dragItemId.current === targetId) {
      dragItemId.current = null;
      setDragOverId(null);
      return;
    }
    const sorted = contents.slice().sort((a, b) => a.order - b.order);
    const fromIdx = sorted.findIndex((c) => c.id === dragItemId.current);
    const toIdx = sorted.findIndex((c) => c.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;

    const reordered = [...sorted];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const withOrders = reordered.map((c, i) => ({ ...c, order: i + 1 }));
    setContents(withOrders);
    setDragOverId(null);
    dragItemId.current = null;

    // Persist new order values
    for (const item of withOrders) {
      try {
        await adminCourseContents.update(selectedCourse.id, item.id, { order: item.order });
      } catch { /* best-effort */ }
    }
  }, [contents, selectedCourse]);

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Courses" subtitle="Manage all courses" onRefresh={load} loading={loading} />

      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="flex items-center bg-gray-900 border border-gray-700 rounded-lg p-1 gap-1">
            {(['all', 'published', 'draft'] as const).map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${filterStatus === s ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <ExportButton data={filtered} filename="courses" />
            <ColumnPicker columns={COURSE_COLS} isVisible={isColVisible} onToggle={toggleColumn} onReset={resetCols} />
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> Add Course
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <span className="text-gray-500 text-xs">{from}–{to} of {total} courses</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-5 py-3 w-10">
                    <input type="checkbox" checked={selection.allSelected} onChange={selection.toggleAll}
                      className="rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500" />
                  </th>
                  <SortableHeader label="Course" sortKey="title" sort={sort} onToggle={toggleSort} className="px-5 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider" />
                  {isColVisible('category') && <th className="px-5 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">Category</th>}
                  {isColVisible('price') && <SortableHeader label="Price" sortKey="price" sort={sort} onToggle={toggleSort} className="px-5 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider" />}
                  {isColVisible('status') && <SortableHeader label="Status" sortKey="is_published" sort={sort} onToggle={toggleSort} className="px-5 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider" />}
                  {isColVisible('created') && <SortableHeader label="Created" sortKey="created_at" sort={sort} onToggle={toggleSort} className="px-5 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider" />}
                  <th className="px-5 py-3 text-right text-gray-500 font-medium text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td>)}</tr>
                  ))
                ) : paged.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-600">No courses found</td></tr>
                ) : (
                  paged.map((course) => (
                    <tr key={course.id} className={`hover:bg-gray-800/40 transition-colors group ${selection.isSelected(course.id) ? 'bg-indigo-500/5' : ''}`}>
                      <td className="px-5 py-3.5">
                        <input type="checkbox" checked={selection.isSelected(course.id)} onChange={() => selection.toggle(course.id)}
                          className="rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500" />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {course.thumbnail ? (
                            <img src={course.thumbnail} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-700" />
                          ) : (
                            <div className="w-9 h-9 bg-indigo-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-4 h-4 text-indigo-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-gray-200 font-medium truncate max-w-[180px]">{course.title}</p>
                            <p className="text-gray-600 text-xs truncate max-w-[180px]">{course.description}</p>
                          </div>
                        </div>
                      </td>
                      {isColVisible('category') && <td className="px-5 py-3.5"><Badge variant="info">{course.category_name || 'None'}</Badge></td>}
                      {isColVisible('price') && <td className="px-5 py-3.5 text-gray-200 font-semibold">${course.price}</td>}
                      {isColVisible('status') && <td className="px-5 py-3.5"><Badge variant={course.is_published ? 'success' : 'default'}>{course.is_published ? 'Published' : 'Draft'}</Badge></td>}
                      {isColVisible('created') && <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(course.created_at).toLocaleDateString()}</td>}                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openContents(course)} className="p-1.5 text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors" title="Manage contents"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => openEdit(course)} className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => openDelete(course)} className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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

      {/* Course Create/Edit Modal */}
      <Modal
        open={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
        title={selectedCourse ? 'Edit Course' : 'New Course'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Thumbnail upload */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Thumbnail</label>
            <div className="flex items-center gap-4">
              {thumbnailPreview ? (
                <div className="relative shrink-0">
                  <img src={thumbnailPreview} alt="Thumbnail" className="w-24 h-16 object-cover rounded-lg border border-gray-700" />
                  <button type="button" onClick={() => { setThumbnailFile(null); setThumbnailPreview(''); }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 rounded-full flex items-center justify-center hover:bg-rose-500 transition-colors">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-16 bg-gray-800 rounded-lg border border-dashed border-gray-700 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-5 h-5 text-gray-600" />
                </div>
              )}
              <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-gray-300 transition-colors">
                <ImageIcon className="w-3.5 h-3.5" />
                {thumbnailFile ? (thumbnailFile.name.length > 22 ? thumbnailFile.name.slice(0, 22) + '…' : thumbnailFile.name) : 'Choose image'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setThumbnailFile(f); setThumbnailPreview(URL.createObjectURL(f)); }
                }} />
              </label>
              <p className="text-xs text-gray-600">PNG, JPG, WebP</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Title" required error={courseErrors.title?.message} className="col-span-2">
              <Input
                {...registerCourse('title')}
                error={!!courseErrors.title}
                placeholder="Course title"
              />
            </FormField>
            <FormField label="Price" required error={courseErrors.price?.message}>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...registerCourse('price')}
                error={!!courseErrors.price}
                placeholder="0.00"
              />
            </FormField>
            <FormField label="Category" error={courseErrors.category?.message}>
              <Select
                {...registerCourse('category')}
                error={!!courseErrors.category}
              >
                <option value="">— None —</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Vendor" className="col-span-2" error={courseErrors.vendor?.message}>
              <Select
                {...registerCourse('vendor')}
                error={!!courseErrors.vendor}
              >
                <option value="">— Assign a vendor —</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.full_name || v.username} ({v.email})
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Description" className="col-span-2" error={courseErrors.description?.message}>
              <RichTextEditor
                value={watchCourse('description') || ''}
                onChange={(v) => setCourseValue('description', v)}
                placeholder="Describe this course..."
              />
            </FormField>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              onClick={() => setCourseValue('is_published', !watchCourse('is_published'))}
              className={`relative w-9 h-5 rounded-full transition-colors ${watchCourse('is_published') ? 'bg-indigo-600' : 'bg-gray-700'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${watchCourse('is_published') ? 'translate-x-4' : ''}`}
              />
            </div>
            <span className="text-sm text-gray-300">Publish immediately</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setCourseModalOpen(false)}
              className="flex-1 px-4 py-2.5 text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitCourse(handleSaveCourse)}
              disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : selectedCourse ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Course Contents Modal */}
      <Modal
        open={contentsOpen}
        onClose={() => setContentsOpen(false)}
        title={`Contents — ${selectedCourse?.title || ''}`}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs">{contents.length} items</span>
            <button
              onClick={openAddContent}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Content
            </button>
          </div>
          {loadingContents ? (
            <div className="py-8 text-center text-gray-600 text-sm">Loading...</div>
          ) : contents.length === 0 ? (
            <div className="py-8 text-center text-gray-600 text-sm">No content yet — add the first one!</div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {contents
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => { dragItemId.current = c.id; }}
                    onDragOver={(e) => { e.preventDefault(); setDragOverId(c.id); }}
                    onDragLeave={() => setDragOverId(null)}
                    onDrop={() => handleContentDrop(c.id)}
                    onDragEnd={() => { dragItemId.current = null; setDragOverId(null); }}
                    className={`flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3 group cursor-grab active:cursor-grabbing transition-all ${
                      dragOverId === c.id ? 'ring-2 ring-indigo-500/50 bg-gray-700' : ''
                    }`}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-gray-600 flex-shrink-0 cursor-grab" />
                    <span className="text-gray-600 text-xs font-mono w-5 text-right">{c.order}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-200 text-sm font-medium truncate">{c.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {c.video_url && (
                          <span className="flex items-center gap-1 text-xs text-indigo-400">
                            <PlayCircle className="w-3 h-3" /> Video
                          </span>
                        )}
                        {c.document_url && (
                          <span className="flex items-center gap-1 text-xs text-amber-400">
                            <FileText className="w-3 h-3" /> Doc
                          </span>
                        )}
                        {c.course_level && (
                          <span className="text-xs text-gray-500">{c.course_level}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditContent(c)}
                        className="p-1 text-gray-500 hover:text-indigo-400 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteContent(c)}
                        className="p-1 text-gray-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Content Create/Edit Modal */}
      <Modal
        open={contentModalOpen}
        onClose={() => setContentModalOpen(false)}
        title={selectedContent ? 'Edit Content' : 'Add Content'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Title" required error={contentErrors.title?.message} className="col-span-2">
              <Input
                {...registerContent('title')}
                error={!!contentErrors.title}
                placeholder="Lesson title"
              />
            </FormField>
            <FormField label="Video URL" error={contentErrors.video_url?.message}>
              <Input
                type="url"
                {...registerContent('video_url')}
                error={!!contentErrors.video_url}
                placeholder="https://..."
              />
            </FormField>
            <FormField label="Document URL" error={contentErrors.document_url?.message}>
              <Input
                type="url"
                {...registerContent('document_url')}
                error={!!contentErrors.document_url}
                placeholder="https://..."
              />
            </FormField>
            <FormField label="Level" error={contentErrors.course_level?.message}>
              <Input
                {...registerContent('course_level')}
                error={!!contentErrors.course_level}
                placeholder="Beginner / Intermediate..."
              />
            </FormField>
            <FormField label="Order" error={contentErrors.order?.message}>
              <Input
                type="number"
                min="0"
                {...registerContent('order', { valueAsNumber: true })}
                error={!!contentErrors.order}
              />
            </FormField>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setContentModalOpen(false)}
              className="flex-1 px-4 py-2.5 text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitContent(handleSaveContent)}
              disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : selectedContent ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteCourse}
        title="Delete Course"
        message={`Are you sure you want to delete "${selectedCourse?.title}"? This cannot be undone.`}
        loading={deleting}
      />

      {/* Bulk Actions */}
      <BulkActionBar count={selection.count} onClear={selection.clear} actions={[
        { label: 'Delete Selected', variant: 'danger', onClick: handleBulkDelete },
      ]} />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
