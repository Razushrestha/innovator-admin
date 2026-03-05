import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
}

/** A single animated shimmer block */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-gray-800 rounded',
        className
      )}
    />
  );
}

/** Placeholder for a StatsCard */
export function SkeletonStatCard() {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 flex items-start justify-between">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
    </div>
  );
}

/** Placeholder for a ChartCard */
export function SkeletonChartCard({ tall }: { tall?: boolean }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className={clsx('w-full rounded-lg', tall ? 'h-56' : 'h-44')} />
    </div>
  );
}

/** Single shimmer table row */
export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  const widths = ['w-5', 'w-28', 'w-36', 'w-20', 'w-16'];
  return (
    <tr className="border-b border-gray-800">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <Skeleton className={clsx('h-3.5', widths[i % widths.length])} />
        </td>
      ))}
    </tr>
  );
}

/** Full page skeleton: toolbar + table */
export function SkeletonPage({
  rows = 8,
  cols = 5,
  title = '',
}: {
  rows?: number;
  cols?: number;
  title?: string;
}) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Header bar */}
      <div className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur-sm border-b border-gray-800 px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            {title ? (
              <p className="text-white font-semibold text-lg">{title}</p>
            ) : (
              <Skeleton className="h-5 w-32" />
            )}
            <Skeleton className="h-3 w-44" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
        </div>
      </div>
      {/* Body */}
      <div className="flex-1 px-6 py-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
          <Skeleton className="h-10 max-w-sm w-full rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>
        {/* Table card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {/* caption */}
          <div className="px-5 py-3 border-b border-gray-800">
            <Skeleton className="h-3 w-32" />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {Array.from({ length: cols }).map((_, i) => (
                  <th key={i} className="px-5 py-3">
                    <Skeleton className="h-3 w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, i) => (
                <SkeletonTableRow key={i} cols={cols} />
              ))}
            </tbody>
          </table>
          {/* Pagination bar */}
          <div className="px-5 py-3 border-t border-gray-800 flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-8 rounded-md" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
