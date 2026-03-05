import clsx from 'clsx';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'default';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const variantMap: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  danger: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  info: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  default: 'bg-gray-700/50 text-gray-400 border-gray-600/30',
};

export default function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border',
        variantMap[variant]
      )}
    >
      {children}
    </span>
  );
}
