import { SkeletonPage } from '@/components/admin/Skeleton';

export default function EnrollmentsLoading() {
  return <SkeletonPage rows={10} cols={5} title="Enrollments" />;
}
