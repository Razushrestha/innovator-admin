'use client';

import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

type ChartType = 'area' | 'bar' | 'line' | 'pie';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  type: ChartType;
  data: Record<string, unknown>[];
  dataKey: string;
  xKey?: string;
  color?: string;
  height?: number;
  loading?: boolean;
  extraLines?: { key: string; color: string }[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: unknown; name: string; color: string }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
        {label && <p className="text-xs text-gray-400 mb-1">{label}</p>}
        {payload.map((p, i) => (
          <p key={i} className="text-xs font-medium" style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : String(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ChartCard({ title, subtitle, type, data, dataKey, xKey = 'name', color = '#6366f1', height = 220, loading, extraLines }: ChartCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {loading ? (
        <div style={{ height }} className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div style={{ height }} className="flex items-center justify-center text-xs text-gray-600">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          {type === 'pie' ? (
            <PieChart>
              <Pie data={data} dataKey={dataKey} nameKey={xKey} cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={3}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
            </PieChart>
          ) : type === 'area' ? (
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#grad-${dataKey})`} strokeWidth={2} dot={false} />
              {extraLines?.map((l) => (
                <Area key={l.key} type="monotone" dataKey={l.key} stroke={l.color} fill="none" strokeWidth={2} dot={false} />
              ))}
            </AreaChart>
          ) : type === 'bar' ? (
            <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ fill: color, r: 3 }} />
              {extraLines?.map((l) => (
                <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
