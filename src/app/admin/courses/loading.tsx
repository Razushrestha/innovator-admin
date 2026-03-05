import { SkeletonPage } from '@/components/admin/Skeleton';

export default function CoursesLoading() {
  return <SkeletonPage rows={10} cols={6} title="Courses" />;
}
