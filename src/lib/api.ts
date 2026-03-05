import { getToken, removeToken, refreshAccessToken } from '@/lib/auth';

const BASE_URL = 'http://182.93.94.220:8003';

let _refreshing: Promise<boolean> | null = null;

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const makeReq = (token: string | null) => {
    const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
        ...(options.headers as Record<string, string> | undefined),
      },
    });
  };

  let res = await makeReq(getToken());

  // Silent token refresh on 401
  if (res.status === 401) {
    if (!_refreshing) _refreshing = refreshAccessToken().finally(() => { _refreshing = null; });
    const refreshed = await _refreshing;
    if (refreshed) {
      res = await makeReq(getToken());
    } else {
      removeToken();
      if (typeof window !== 'undefined') window.location.href = '/admin/login';
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (res.status === 204) return null as T;
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `Request failed: ${res.status}`);
  }
  return res.json();
}

/** Upload a course thumbnail via multipart PATCH */
export async function uploadCourseThumbnail(courseId: string, file: File): Promise<import('@/types').AdminCourse> {
  const token = getToken();
  const formData = new FormData();
  formData.append('thumbnail', file);
  const res = await fetch(`${BASE_URL}/api/admin/courses/${courseId}/`, {
    method: 'PATCH',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Thumbnail upload failed: ${res.status}`);
  }
  return res.json();
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export async function loginWithCredentials(
  username: string,
  password: string,
  authUrl: string = `${BASE_URL}/api/token/`
): Promise<{ access: string; refresh?: string }> {
  const res = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Login failed: ${res.status}`);
  }
  return res.json();
}

// ─── Admin Categories ────────────────────────────────────────────────────────
export const adminCategories = {
  list: () => request<import('@/types').Category[]>('/api/admin/categories/'),
  create: (data: Partial<import('@/types').Category>) =>
    request<import('@/types').Category>('/api/admin/categories/', { method: 'POST', body: JSON.stringify(data) }),
  retrieve: (id: string) => request<import('@/types').Category>(`/api/admin/categories/${id}/`),
  update: (id: string, data: Partial<import('@/types').Category>) =>
    request<import('@/types').Category>(`/api/admin/categories/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  destroy: (id: string) => request<null>(`/api/admin/categories/${id}/`, { method: 'DELETE' }),
};

// ─── Admin Courses ───────────────────────────────────────────────────────────
export const adminCourses = {
  list: () => request<import('@/types').AdminCourse[]>('/api/admin/courses/'),
  create: (data: Record<string, unknown>) =>
    request<import('@/types').AdminCourse>('/api/admin/courses/', { method: 'POST', body: JSON.stringify(data) }),
  retrieve: (id: string) => request<import('@/types').AdminCourse>(`/api/admin/courses/${id}/`),
  update: (id: string, data: Record<string, unknown> | Partial<import('@/types').AdminCourse>) =>
    request<import('@/types').AdminCourse>(`/api/admin/courses/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  destroy: (id: string) => request<null>(`/api/admin/courses/${id}/`, { method: 'DELETE' }),
};

// ─── Admin Course Contents ───────────────────────────────────────────────────
export const adminCourseContents = {
  list: (coursePk: string) =>
    request<import('@/types').CourseContent[]>(`/api/admin/courses/${coursePk}/contents/`),
  create: (coursePk: string, data: Partial<import('@/types').CourseContent>) =>
    request<import('@/types').CourseContent>(`/api/admin/courses/${coursePk}/contents/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (coursePk: string, id: string, data: Partial<import('@/types').CourseContent>) =>
    request<import('@/types').CourseContent>(`/api/admin/courses/${coursePk}/contents/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  destroy: (coursePk: string, id: string) =>
    request<null>(`/api/admin/courses/${coursePk}/contents/${id}/`, { method: 'DELETE' }),
};

// ─── Admin Vendors ───────────────────────────────────────────────────────────
export const adminVendors = {
  list: () => request<import('@/types').VendorProfile[]>('/api/admin/vendors/'),
  create: (data: Partial<import('@/types').VendorProfile>) =>
    request<import('@/types').VendorProfile>('/api/admin/vendors/', { method: 'POST', body: JSON.stringify(data) }),
  retrieve: (id: string) => request<import('@/types').VendorProfile>(`/api/admin/vendors/${id}/`),
  update: (id: string, data: Partial<import('@/types').VendorProfile>) =>
    request<import('@/types').VendorProfile>(`/api/admin/vendors/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  destroy: (id: string) => request<null>(`/api/admin/vendors/${id}/`, { method: 'DELETE' }),
};

// ─── Public Courses ──────────────────────────────────────────────────────────
export const publicCourses = {
  list: () => request<import('@/types').CourseList[]>('/api/courses/'),
};

// ─── Student Enrollments ─────────────────────────────────────────────────────
export const studentEnrollments = {
  list: () => request<import('@/types').Enrollment[]>('/api/student/enrollments/'),
  create: (data: Partial<import('@/types').Enrollment>) =>
    request<import('@/types').Enrollment>('/api/student/enrollments/', { method: 'POST', body: JSON.stringify(data) }),
  retrieve: (id: string) => request<import('@/types').Enrollment>(`/api/student/enrollments/${id}/`),
  update: (id: string, data: Partial<import('@/types').Enrollment>) =>
    request<import('@/types').Enrollment>(`/api/student/enrollments/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  destroy: (id: string) => request<null>(`/api/student/enrollments/${id}/`, { method: 'DELETE' }),
};

// ─── Vendor Payouts ──────────────────────────────────────────────────────────
export const vendorPayouts = {
  list: () => request<import('@/types').PayoutRequest[]>('/api/vendor/payouts/'),
  create: (data: Partial<import('@/types').PayoutRequest>) =>
    request<import('@/types').PayoutRequest>('/api/vendor/payouts/', { method: 'POST', body: JSON.stringify(data) }),
  retrieve: (id: string) => request<import('@/types').PayoutRequest>(`/api/vendor/payouts/${id}/`),
  update: (id: string, data: Partial<import('@/types').PayoutRequest>) =>
    request<import('@/types').PayoutRequest>(`/api/vendor/payouts/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  destroy: (id: string) => request<null>(`/api/vendor/payouts/${id}/`, { method: 'DELETE' }),
};

// ─── Vendor Profile ──────────────────────────────────────────────────────────
export const vendorProfile = {
  retrieve: () => request<import('@/types').VendorProfile>('/api/vendor/profile/'),
};

// ─── Internal ────────────────────────────────────────────────────────────────
export const internalApi = {
  syncUser: (data: import('@/types').UserSync) =>
    request<import('@/types').UserSync>('/api/internal/sync-user/', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Admin Dashboard ─────────────────────────────────────────────────────────
export const adminDashboard = {
  getSummary: () => request<import('@/types').DashboardSummary>('/api/admin/dashboard/summary/'),
};
