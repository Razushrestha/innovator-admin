'use client';

import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/admin/Header';
import StatsCard from '@/components/admin/StatsCard';
import Badge from '@/components/admin/Badge';
import ChartCard from '@/components/admin/ChartCard';
import ChartErrorBoundary from '@/components/admin/ChartErrorBoundary';
import ActivityFeed from '@/components/admin/ActivityFeed';
import {
  BookOpen, Users, GraduationCap, FolderOpen, CreditCard,
  TrendingUp, CheckCircle, Clock, Radio,
} from 'lucide-react';
import { adminDashboard } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getTokenRole, decodeJwt } from '@/lib/jwt';
import { usePolling } from '@/hooks/usePolling';
import type { DashboardSummary } from '@/types';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pollingEnabled, setPollingEnabled] = useState(true);

  const token = getToken();
  const role = token ? getTokenRole(token) : 'viewer';
  const username = token ? (decodeJwt(token)?.username ?? 'Admin') : 'Admin';

  const fetchSummary = useCallback(async () => {
    try {
      const summary = await adminDashboard.getSummary();
      setData(summary);
      setLastUpdated(new Date());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  usePolling(fetchSummary, 60_000, pollingEnabled);

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col">
        <Header title="Dashboard" subtitle="Loading analytics..." loading={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Courses', value: data?.stats.courses.value || 0, trend: data?.stats.courses.trend, icon: BookOpen, color: 'indigo' as const },
    { label: 'Total Vendors', value: data?.stats.vendors.value || 0, trend: data?.stats.vendors.trend, icon: Users, color: 'violet' as const },
    { label: 'Enrollments', value: data?.stats.enrollments.value || 0, trend: data?.stats.enrollments.trend, icon: GraduationCap, color: 'emerald' as const },
    { label: 'Revenue', value: `$${data?.stats.revenue.value || '0.00'}`, trend: data?.stats.revenue.trend, icon: CreditCard, color: 'amber' as const },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Dashboard" subtitle={`Welcome back, ${username} · ${role}`} onRefresh={fetchSummary} loading={loading} />
      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 space-y-6">

        {/* Polling status */}
        <div className="flex items-center gap-3">
          <button onClick={() => setPollingEnabled((v) => !v)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${pollingEnabled ? 'border-emerald-700 text-emerald-400 bg-emerald-950/40' : 'border-gray-700 text-gray-500 bg-gray-800/40'}`}>
            <Radio size={11} className={pollingEnabled ? 'animate-pulse' : ''} />
            {pollingEnabled ? 'Live · 60s' : 'Paused'}
          </button>
          {lastUpdated && <span className="text-[10px] text-gray-600 uppercase tracking-wider">Refreshed {lastUpdated.toLocaleTimeString()}</span>}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {kpis.map((kpi) => (
            <StatsCard key={kpi.label} {...kpi} title={kpi.label} />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartErrorBoundary title="Enrollment Trend" onReset={fetchSummary}>
              <ChartCard
                title="Enrollment Trend"
                subtitle="Last 7 days"
                type="area"
                data={data?.charts.enrollmentTrend || []}
                dataKey="count"
                xKey="name"
                color="#6366f1"
                loading={loading}
              />
            </ChartErrorBoundary>
          </div>
          <ChartErrorBoundary title="Courses by Category" onReset={fetchSummary}>
            <ChartCard
              title="Courses by Category"
              subtitle="Top 6 distribution"
              type="pie"
              data={data?.charts.categoryDistribution || []}
              dataKey="value"
              xKey="name"
              loading={loading}
            />
          </ChartErrorBoundary>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="">
            <ChartErrorBoundary title="Revenue Trend" onReset={fetchSummary}>
              <ChartCard
                title="Revenue Trend"
                subtitle="Last 6 months (Approved payouts)"
                type="bar"
                data={data?.charts.revenueTrend || []}
                dataKey="revenue"
                xKey="name"
                color="#10b981"
                loading={loading}
              />
            </ChartErrorBoundary>
          </div>
          <ActivityFeed limit={10} />
        </div>
      </div>
    </div>
  );
}

