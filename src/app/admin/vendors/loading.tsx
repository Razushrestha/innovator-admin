import { SkeletonPage } from '@/components/admin/Skeleton';

export default function VendorsLoading() {
  return <SkeletonPage rows={10} cols={6} title="Vendors" />;
}
