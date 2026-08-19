import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Download, TrendingUp, TrendingDown } from "lucide-react";
import {
  Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ComposedChart, Line
} from "recharts";
import { analyticsApi } from "@/api";
import { QUERY_KEYS } from "@/constants";
import { formatCurrency, formatCompact } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Period = "daily" | "weekly" | "monthly" | "yearly";

const PERIOD_OPTIONS: { label: string; value: Period }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

export default function RevenuePage() {
  const [period, setPeriod] = useState<Period>("monthly");
  const navigate = useNavigate();

  const { data: revenueData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.revenue(period),
    queryFn: () => analyticsApi.getRevenue(period),
  });

  const totalRevenue = revenueData?.reduce((s, d) => s + (d.revenue ?? 0), 0) ?? 0;
  const totalOrders = revenueData?.reduce((s, d) => s + (d.orders ?? 0), 0) ?? 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/analytics")}
          className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground-muted hover:bg-surface-elevated transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1">
          <h2 className="text-base font-bold text-foreground">Revenue Analysis</h2>
          <p className="text-xs text-foreground-muted">Detailed revenue breakdown</p>
        </div>
        <Button variant="outline" size="sm" icon={<Download size={13} />}>
          Export CSV
        </Button>
      </div>

      {/* Period Selector */}
      <div className="flex gap-1 bg-surface-elevated rounded-xl p-1 w-fit">
        {PERIOD_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              period === opt.value
                ? "bg-surface text-primary-hover shadow-card"
                : "text-foreground-muted hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">{formatCompact(totalRevenue)}</p>
              <p className="text-xs text-foreground-muted mt-1">Total Revenue</p>
            </div>
            <div className="flex items-center gap-0.5 text-xs font-medium text-success">
              <TrendingUp size={12} /> 18%
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">{totalOrders}</p>
              <p className="text-xs text-foreground-muted mt-1">Total Orders</p>
            </div>
            <div className="flex items-center gap-0.5 text-xs font-medium text-success">
              <TrendingUp size={12} /> 23%
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(Math.round(avgOrderValue))}</p>
              <p className="text-xs text-foreground-muted mt-1">Avg Order Value</p>
            </div>
            <div className="flex items-center gap-0.5 text-xs font-medium text-error">
              <TrendingDown size={12} /> 3%
            </div>
          </div>
        </Card>
      </div>

      {/* Main Revenue Chart */}
      <Card>
        <CardHeader title="Revenue Trend" subtitle={`${period.charAt(0).toUpperCase() + period.slice(1)} view`} />
        {isLoading ? (
          <div className="h-60 skeleton rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={revenueData} margin={{ top: 0, right: 0, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#006D5B" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#006D5B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <Tooltip
                formatter={(v: number, name: string) =>
                  name === "revenue" ? formatCurrency(v) : v
                }
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
              />
              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#006D5B" strokeWidth={2} fill="url(#revGrad)" name="revenue" />
              <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={1.5} dot={false} name="orders" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Bar chart breakdown */}
      <Card>
        <CardHeader title="Revenue Distribution" subtitle="Volume comparison" />
        {!isLoading && (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData?.slice(0, 20)} margin={{ top: 0, right: 0, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="revenue" fill="#006D5B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
