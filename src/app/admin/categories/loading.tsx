import { SkeletonPage } from '@/components/admin/Skeleton';

export default function CategoriesLoading() {
  return <SkeletonPage rows={8} cols={5} title="Categories" />;
}
