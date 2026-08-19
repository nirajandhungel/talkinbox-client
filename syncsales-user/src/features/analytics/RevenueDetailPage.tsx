import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, Download } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { formatCurrency, formatCompact } from "@/lib/utils";
import { analyticsApi } from "@/api";
import { QUERY_KEYS } from "@/constants";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/feedback/Toast";
import { SkeletonCard } from "@/components/feedback/Skeleton";

type Period = "daily" | "weekly" | "monthly" | "yearly";

const PERIOD_TABS: { key: Period; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

export default function RevenueDetailPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("daily");
  const { success } = useToast();

  const { data: chartData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.revenue(period),
    queryFn: () => analyticsApi.getRevenue(period),
  });

  const totalRevenue = chartData?.reduce((s, d) => s + d.revenue, 0) ?? 0;
  const totalOrders = chartData?.reduce((s, d) => s + d.orders, 0) ?? 0;
  const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Peak period
  const peakEntry = chartData?.reduce(
    (best, cur) => (cur.revenue > best.revenue ? cur : best),
    chartData[0]
  );

  const handleExport = () => {
    if (!chartData || chartData.length === 0) return;
    const headers = ["Period", "Revenue", "Orders"];
    const rows = chartData.map((d) => [d.date, d.revenue, d.orders]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-${period}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
    success("Revenue data exported");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-5 max-w-[1200px]"
    >
      {/* Back + Header */}
      <button
        onClick={() => navigate("/analytics")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-primary transition-colors group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Analytics
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Revenue Breakdown</h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Detailed revenue and order analysis
          </p>
        </div>
        <Button variant="outline" size="sm" icon={<Download size={13} />} onClick={handleExport}>
          Export CSV
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)
        ) : (
          [
            { label: "Total Revenue", value: formatCompact(totalRevenue), icon: "💰", positive: true },
            { label: "Total Orders", value: totalOrders.toLocaleString(), icon: "📦", positive: true },
            { label: "Avg Order Value", value: formatCurrency(avgOrder), icon: "📊", positive: true },
            { label: "Peak Revenue", value: formatCompact(peakEntry?.revenue ?? 0), icon: "🏆", positive: true },
          ].map((kpi) => (
            <Card key={kpi.label} padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-xl font-bold text-foreground font-mono mt-1">{kpi.value}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
                  {kpi.icon}
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {kpi.positive ? (
                  <TrendingUp size={11} className="text-success" />
                ) : (
                  <TrendingDown size={11} className="text-error" />
                )}
                <span className="text-[10px] font-medium text-success">vs previous period</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Period Selection */}
      <div className="flex items-center gap-1 bg-surface-elevated rounded-lg p-0.5 w-fit">
        {PERIOD_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPeriod(tab.key)}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
              period === tab.key
                ? "bg-surface shadow-sm text-primary"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader
          title="Revenue Over Time"
          subtitle={`${period.charAt(0).toUpperCase() + period.slice(1)} view`}
        />
        {isLoading ? (
          <div className="h-[300px] skeleton rounded-lg" />
        ) : chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#006D5B" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#006D5B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                interval={chartData.length > 15 ? 4 : 0}
              />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #e2e8f0" }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#006D5B"
                strokeWidth={2}
                fill="url(#revFill)"
                name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-sm text-foreground-muted">
            No revenue data for this period
          </div>
        )}
      </Card>

      {/* Orders Chart */}
      <Card>
        <CardHeader title="Orders Over Time" subtitle="Number of orders per period" />
        {isLoading ? (
          <div className="h-[220px] skeleton rounded-lg" />
        ) : chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                interval={chartData.length > 15 ? 4 : 0}
              />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #e2e8f0" }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="orders" fill="#3B82F6" radius={[3, 3, 0, 0]} name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-sm text-foreground-muted">
            No data available
          </div>
        )}
      </Card>

      {/* Detailed Data Table */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Period Breakdown</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Period", "Revenue", "Orders", "Avg Order", "Revenue Share"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!chartData || chartData.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-foreground-muted">No data available</td></tr>
              ) : (
                chartData.map((entry, i) => {
                  const avgOrd = entry.orders > 0 ? Math.round(entry.revenue / entry.orders) : 0;
                  const share = totalRevenue > 0 ? ((entry.revenue / totalRevenue) * 100).toFixed(1) : "0";
                  return (
                    <tr
                      key={i}
                      className={`${i < chartData.length - 1 ? "border-b border-border" : ""} hover:bg-surface-elevated transition-colors`}
                    >
                      <td className="px-4 py-3 text-xs font-medium text-foreground">{entry.date}</td>
                      <td className="px-4 py-3 text-xs font-bold text-primary font-mono">
                        {formatCurrency(entry.revenue)}
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground-muted font-mono">{entry.orders}</td>
                      <td className="px-4 py-3 text-xs text-foreground-muted font-mono">{formatCurrency(avgOrd)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-surface-elevated rounded-full overflow-hidden max-w-[80px]">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-foreground-muted font-mono">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
