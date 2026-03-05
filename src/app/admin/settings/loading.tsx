import { Skeleton } from '@/components/admin/Skeleton';

export default function SettingsLoading() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur-sm border-b border-gray-800 px-4 lg:px-6 py-4">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 max-w-2xl space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
