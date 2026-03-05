import { SkeletonStatCard, SkeletonChartCard } from '@/components/admin/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur-sm border-b border-gray-800 px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-24 bg-gray-800 animate-pulse rounded" />
            <div className="h-3 w-48 bg-gray-800 animate-pulse rounded" />
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-gray-800 animate-pulse rounded-lg" />
            <div className="w-8 h-8 bg-gray-800 animate-pulse rounded-lg" />
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* Polling toggle placeholder */}
        <div className="h-6 w-24 bg-gray-800 animate-pulse rounded-full" />

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkeletonChartCard tall />
          </div>
          <SkeletonChartCard />
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChartCard />
          <SkeletonChartCard />
        </div>
      </div>
    </div>
  );
}
