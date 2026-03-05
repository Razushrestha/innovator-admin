import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan';
}

const colorMap = {
  indigo: { bg: 'bg-indigo-500/10', icon: 'text-indigo-400', border: 'border-indigo-500/20' },
  emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', border: 'border-emerald-500/20' },
  amber: { bg: 'bg-amber-500/10', icon: 'text-amber-400', border: 'border-amber-500/20' },
  rose: { bg: 'bg-rose-500/10', icon: 'text-rose-400', border: 'border-rose-500/20' },
  violet: { bg: 'bg-violet-500/10', icon: 'text-violet-400', border: 'border-violet-500/20' },
  cyan: { bg: 'bg-cyan-500/10', icon: 'text-cyan-400', border: 'border-cyan-500/20' },
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'indigo',
}: StatsCardProps) {
  const colors = colorMap[color];
  return (
    <div
      className={clsx(
        'bg-gray-900 rounded-xl border p-5 flex items-start justify-between hover:bg-gray-800/60 transition-colors',
        colors.border
      )}
    >
      <div>
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
        <p className="text-white text-2xl font-bold">{value}</p>
        {trend && (
          <p
            className={clsx(
              'text-xs mt-1.5 font-medium',
              trend.positive ? 'text-emerald-400' : 'text-rose-400'
            )}
          >
            {trend.positive ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
      <div className={clsx('p-2.5 rounded-lg', colors.bg)}>
        <Icon className={clsx('w-5 h-5', colors.icon)} />
      </div>
    </div>
  );
}
