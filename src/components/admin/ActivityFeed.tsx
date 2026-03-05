'use client';

import { Clock, Plus, Pencil, Trash2, CheckCircle, XCircle, LogIn, Info, ExternalLink } from 'lucide-react';
import { useActivity } from '@/context/ActivityContext';
import type { ActivityEntry } from '@/context/ActivityContext';
import Link from 'next/link';

const iconMap = {
  create: <Plus size={13} className="text-emerald-400" />,
  update: <Pencil size={13} className="text-blue-400" />,
  delete: <Trash2 size={13} className="text-red-400" />,
  approve: <CheckCircle size={13} className="text-emerald-400" />,
  reject: <XCircle size={13} className="text-red-400" />,
  login: <LogIn size={13} className="text-indigo-400" />,
  info: <Info size={13} className="text-gray-400" />,
};

const bgMap = {
  create: 'bg-emerald-950/60 border-emerald-900',
  update: 'bg-blue-950/60 border-blue-900',
  delete: 'bg-red-950/60 border-red-900',
  approve: 'bg-emerald-950/60 border-emerald-900',
  reject: 'bg-red-950/60 border-red-900',
  login: 'bg-indigo-950/60 border-indigo-900',
  info: 'bg-gray-800/60 border-gray-700',
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function ActivityItem({ entry }: { entry: ActivityEntry }) {
  const content = (
    <div className={`flex items-start gap-2.5 p-3 rounded-lg border transition-all ${bgMap[entry.type]} ${entry.link ? 'hover:scale-[1.01] hover:shadow-lg hover:shadow-indigo-500/10 active:scale-[0.99]' : ''}`}>
      <div className="mt-0.5 w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
        {iconMap[entry.type]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider opacity-90">{entry.action}</span>
            {entry.link && <ExternalLink size={10} className="text-gray-500" />}
          </div>
          <span className="text-[10px] text-gray-500 shrink-0 font-medium">{timeAgo(entry.timestamp)}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed ring-offset-gray-900 line-clamp-2">
          <span className="text-gray-200 font-medium">{entry.resource}:</span> {entry.detail}
        </p>
      </div>
    </div>
  );

  if (entry.link) {
    return <Link href={entry.link} className="block group">{content}</Link>;
  }

  return content;
}

export default function ActivityFeed({ limit = 20 }: { limit?: number }) {
  const { activities, clear } = useActivity();
  const visible = activities.slice(0, limit);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-gray-400" />
          <h3 className="text-sm font-medium text-white">Activity Log</h3>
          {activities.length > 0 && (
            <span className="text-xs bg-gray-800 text-gray-400 rounded-full px-2 py-0.5">{activities.length}</span>
          )}
        </div>
        {activities.length > 0 && (
          <button onClick={clear} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
            Clear
          </button>
        )}
      </div>
      <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
        {visible.length === 0 ? (
          <p className="text-center text-xs text-gray-600 py-6">No activity yet</p>
        ) : (
          visible.map((entry) => <ActivityItem key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}
