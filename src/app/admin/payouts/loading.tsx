import { SkeletonPage } from '@/components/admin/Skeleton';

export default function PayoutsLoading() {
  return <SkeletonPage rows={10} cols={6} title="Payouts" />;
}
