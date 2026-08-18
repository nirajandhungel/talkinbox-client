import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, ArrowRight } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { analyticsApi, dashboardApi } from "@/api";
import { QUERY_KEYS } from "@/constants";
import { formatCurrency, formatCompact } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SkeletonCard } from "@/components/feedback/Skeleton";

export default function AnalyticsPage() {
  const navigate = useNavigate();

  const { data: platformData, isLoading: platformLoading } = useQuery({
    queryKey: [...QUERY_KEYS.analytics, "platform"],
    queryFn: analyticsApi.getPlatformBreakdown,
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: [...QUERY_KEYS.analytics, "revenue", "overview"],
    queryFn: () => analyticsApi.getRevenueOverview(),
  });

  const { data: dashStats } = useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: dashboardApi.getStats,
  });

  const totalRevenue = revenueData?.reduce((s, m) => s + m.revenue, 0) ?? 0;
  const totalOrders = revenueData?.reduce((s, m) => s + m.orders, 0) ?? 0;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const isLoading = revenueLoading || platformLoading;

  return (
    <div className="space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Analytics</h2>
          <p className="text-xs text-slate-500">Business performance overview</p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)
        ) : (
          [
            { label: "Total Revenue", value: formatCompact(totalRevenue), change: "—", onClick: () => navigate("/analytics/revenue") },
            { label: "Avg Order Value", value: formatCurrency(avgOrderValue), change: "—" },
            { label: "Total Orders", value: totalOrders.toLocaleString(), change: "—" },
            { label: "Total Customers", value: dashStats?.totalCustomers?.toLocaleString() ?? "—", change: "—" },
          ].map(s => (
            <Card key={s.label} hoverable={!!s.onClick} onClick={s.onClick} padding="md">
              <p className="text-xl font-bold text-slate-800">{s.value}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-slate-500">{s.label}</p>
                <span className="text-xs font-medium text-green-600">{s.change}</span>
              </div>
              {s.onClick && (
                <div className="flex items-center gap-1 mt-2 text-[10px] text-primary-600 font-medium">
                  <TrendingUp size={10} /> View detailed breakdown <ArrowRight size={10} />
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader
            title="Revenue Trend"
            subtitle="Revenue over time"
            action={<Button variant="ghost" size="xs" onClick={() => navigate("/analytics/revenue")}>Detailed view →</Button>}
          />
          {revenueData && revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#006D5B" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#006D5B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Area type="monotone" dataKey="revenue" stroke="#006D5B" strokeWidth={2} fill="url(#revG)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">
              {revenueData ? "No revenue data available" : <div className="h-[220px] skeleton rounded-lg w-full" />}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Revenue by Channel" subtitle="Channel breakdown" />
          {platformData && platformData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={platformData} dataKey="revenue" nameKey="channel" cx="50%" cy="50%" outerRadius={70} paddingAngle={2}>
                    {platformData.map((entry, i) => (
                      <Cell key={i} fill={entry.color || `hsl(${i * 60}, 60%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {platformData.map(p => (
                  <div key={p.channel} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color || "#006D5B" }} />
                    <span className="text-xs text-slate-600 flex-1">{p.channel}</span>
                    <span className="text-xs font-semibold text-slate-700">{formatCompact(p.revenue)}</span>
                    <span className="text-[10px] text-slate-400">{p.orders} orders</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">
              {platformData ? "No channel data available" : <div className="h-[220px] skeleton rounded-lg w-full" />}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Revenue & Orders Over Time" subtitle="Combined view" />
        {revenueData && revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#006D5B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">
            No data available
          </div>
        )}
      </Card>
    </div>
  );
}
