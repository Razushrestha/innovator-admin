export interface Category {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
}

export interface CourseContent {
  id: string;
  title: string;
  video_url?: string | null;
  document_url?: string | null;
  course_level?: string | null;
  order: number;
  created_at: string;
  course: string;
}

export interface AdminCourse {
  id: string;
  category?: string | null;
  category_name: string;
  title: string;
  description: string;
  price: number;
  is_published?: boolean;
  created_at: string;
  vendor?: string;
  vendor_name?: string;
  thumbnail?: string | null;
  contents?: CourseContent[];
}

export interface Course {
  id: string;
  vendor: string;
  vendor_name: string;
  category?: string | null;
  category_name: string;
  title: string;
  description: string;
  price: number;
  is_published: boolean;
  created_at: string;
  contents: CourseContent[];
}

export interface CourseList {
  id: string;
  vendor: string;
  vendor_name: string;
  category?: string | null;
  category_name: string;
  title: string;
  description: string;
  price: number;
  is_published: boolean;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student: string;
  course: string;
  course_title: string;
  enrolled_at: string;
}

export type StatusEnum = 'pending' | 'approved' | 'rejected';

export interface PayoutRequest {
  id: string;
  amount: string;
  status: StatusEnum;
  requested_at: string;
  processed_at?: string | null;
  vendor: string;
}

export interface VendorProfile {
  id: string;
  user: string;
  username: string;
  full_name?: string;
  email: string;
  is_approved: boolean;
  bio?: string | null;
  commission_rate?: number;
  commission_amount: number;
  total_earnings: number;
  created_at: string;
  courses_count: number;
  courses: string;
}

export interface UserSync {
  id: string;
  username: string;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  phone_number?: string | null;
}

export interface DashboardStats {
  totalCourses: number;
  totalVendors: number;
  totalEnrollments: number;
  totalCategories: number;
  pendingPayouts: number;
  publishedCourses: number;
  approvedVendors: number;
  totalRevenue: string;
}

export interface TrendData {
  value: string;
  positive: boolean;
}

export interface DashboardSummary {
  stats: {
    courses: { value: number; trend?: TrendData };
    vendors: { value: number; trend?: TrendData };
    enrollments: { value: number; trend?: TrendData };
    revenue: { value: string; trend?: TrendData };
  };
  charts: {
    enrollmentTrend: { name: string; count: number }[];
    categoryDistribution: { name: string; value: number }[];
    revenueTrend: { name: string; revenue: number }[];
  };
}
