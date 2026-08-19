import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, TrendingDown, ShoppingCart, Users, Package, BarChart2, ArrowRight, AlertTriangle, RefreshCw
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";
import { motion } from "framer-motion";
import { dashboardApi, productsApi, ordersApi, analyticsApi } from "@/api";
import { QUERY_KEYS, ORDER_STATUS_CONFIG } from "@/constants";
import { formatCurrency, formatCompact } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/feedback/Skeleton";
import { useChartTheme } from "@/hooks/useChartTheme";

// ─── Skeleton components ─────────────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <div className="bg-surface rounded-xl border border-border p-5 space-y-3 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="w-8 h-8 rounded-lg bg-surface-elevated" />
        <div className="w-10 h-4 rounded bg-surface-elevated" />
      </div>
      <div className="w-20 h-7 rounded bg-surface-elevated" />
      <div className="w-28 h-3 rounded bg-surface-elevated" />
    </div>
  );
}

function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="animate-pulse" style={{ height }}>
      <div className="h-full rounded-lg bg-surface-elevated flex items-end gap-1 px-4 pb-4">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className="flex-1 bg-border rounded-t"
            style={{ height: `${30 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-border animate-pulse">
      <div className="w-16 h-3 rounded bg-surface-elevated" />
      <div className="flex-1 h-3 rounded bg-surface-elevated" />
      <div className="w-12 h-3 rounded bg-surface-elevated" />
      <div className="w-16 h-5 rounded-full bg-surface-elevated" />
    </div>
  );
}

// ─── Error state ─────────────────────────────────────────────────────────────
function ErrorBlock({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <AlertTriangle size={18} className="text-warning" />
      <p className="text-xs text-foreground-muted">{label}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors font-medium"
      >
        <RefreshCw size={11} /> Retry
      </button>
    </div>
  );
}

// ─── Animation presets ────────────────────────────────────────────────────────
const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const ITEM = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ─── Dashboard Page ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const chart = useChartTheme();

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: dashboardApi.getStats,
    retry: 1,
  });

  const {
    data: ordersData,
    isLoading: ordersLoading,
    isError: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: [...QUERY_KEYS.orders, { page: 1, pageSize: 5 }],
    queryFn: () => ordersApi.getAll({ page: 1, pageSize: 5 }),
    retry: 1,
  });

  const {
    data: productsData,
    isLoading: productsLoading,
  } = useQuery({
    queryKey: [...QUERY_KEYS.products, { page: 1, pageSize: 10, lowStock: true }],
    queryFn: () => productsApi.getAll({ page: 1, pageSize: 10, lowStock: true }),
    retry: 1,
  });

  const {
    data: revenueData,
    isLoading: revenueLoading,
    isError: revenueError,
    refetch: refetchRevenue,
  } = useQuery({
    queryKey: [...QUERY_KEYS.analytics, "revenue", "overview"],
    queryFn: () => analyticsApi.getRevenueOverview(),
    retry: 1,
  });

  const lowStockProducts = productsData?.data ?? [];
  const recentOrders = ordersData?.data ?? [];

  // Stat cards config
  const statCards = [
    {
      title: "Today's Revenue",
      value: statsLoading ? null : statsError ? "—" : formatCompact(stats?.weekRevenue ?? 0),
      change: statsError ? undefined : stats ? 0 : undefined,
      icon: <TrendingUp size={16} />,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      onClick: () => navigate("/analytics/revenue"),
    },
    {
      title: "Today's Orders",
      value: statsLoading ? null : statsError ? "—" : (stats?.todayOrders ?? 0),
      icon: <ShoppingCart size={16} />,
      iconBg: "bg-primary-soft",
      iconColor: "text-primary",
      onClick: () => navigate("/orders"),
    },
    {
      title: "Total Customers",
      value: statsLoading ? null : statsError ? "—" : (stats?.totalCustomers ?? 0),
      icon: <Users size={16} />,
      iconBg: "bg-primary-soft",
      iconColor: "text-primary",
      onClick: () => navigate("/customers"),
    },
    {
      title: "Low Stock Items",
      value: statsLoading ? null : statsError ? "—" : (stats?.lowStockCount ?? 0),
      icon: <Package size={16} />,
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
      onClick: () => navigate("/inventory"),
    },
  ];

  return (
    <motion.div
      variants={CONTAINER}
      initial="hidden"
      animate="visible"
      className="space-y-5 max-w-[1400px]"
    >
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <motion.div key={card.title} variants={ITEM}>
            {statsLoading ? (
              <StatCardSkeleton />
            ) : (
              <Card
                padding="md"
                hoverable
                onClick={card.onClick}
                className="group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${card.iconBg}`}>
                    <span className={card.iconColor}>{card.icon}</span>
                  </div>
                  {card.change !== undefined && (
                    <div className={`flex items-center gap-0.5 text-xs font-medium ${card.change >= 0 ? "text-success" : "text-error"}`}>
                      {card.change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {Math.abs(card.change)}%
                    </div>
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">
                  {String(card.value ?? "—")}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-foreground-muted">{card.title}</p>
                  <ArrowRight size={12} className="text-foreground-muted group-hover:text-primary transition-colors" />
                </div>
              </Card>
            )}
          </motion.div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <motion.div variants={ITEM} className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Revenue Overview"
              subtitle="Last 30 days"
              action={
                <Button variant="ghost" size="xs" onClick={() => navigate("/analytics/revenue")}>
                  View details →
                </Button>
              }
            />
            {revenueLoading ? (
              <ChartSkeleton height={200} />
            ) : revenueError ? (
              <ErrorBlock label="Could not load revenue data" onRetry={refetchRevenue} />
            ) : revenueData && revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chart.primary} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={chart.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis dataKey="date" tick={chart.tick} />
                  <YAxis tick={chart.tickSmall} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    labelStyle={{ fontSize: 12, color: chart.foreground }}
                    contentStyle={chart.tooltip}
                  />
                  <Area type="monotone" dataKey="grossRevenue" stroke={chart.primary} strokeWidth={2} fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center gap-2 text-center">
                <BarChart2 size={30} className="text-foreground" />
                <p className="text-sm text-foreground-muted font-medium">No revenue data yet</p>
                <p className="text-xs text-foreground-muted">Revenue will appear once orders are placed</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Quick stats / placeholder */}
        <motion.div variants={ITEM}>
          <Card className="h-full">
            <CardHeader title="Channel Breakdown" subtitle="Sales by platform" />
            <div className="mt-2 space-y-3">
              {[
                { label: "COD / Direct", color: chart.warning, pct: 100 },
              ].map((ch) => (
                <div key={ch.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-foreground-muted">{ch.label}</span>
                    <span className="text-xs font-semibold text-foreground">{ch.pct}%</span>
                  </div>
                  <div className="w-full bg-surface-elevated rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-1000"
                      style={{ width: `${ch.pct}%`, background: ch.color }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-foreground-muted pt-2">
                More channels will appear as you connect integrations
              </p>
              <Button
                variant="ghost"
                size="xs"
                className="w-full mt-1"
                onClick={() => navigate("/integrations")}
              >
                Connect channels →
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ── Tables Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Orders */}
        <motion.div variants={ITEM} className="lg:col-span-2">
          <Card padding="none">
            <div className="px-5 py-4 flex justify-between items-center border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Recent Orders</h3>
                <p className="text-xs text-foreground-muted">Latest activity</p>
              </div>
              <Button variant="ghost" size="xs" onClick={() => navigate("/orders")}>
                View all →
              </Button>
            </div>
            <div>
              {ordersLoading ? (
                Array.from({ length: 5 }, (_, i) => <TableRowSkeleton key={i} />)
              ) : ordersError ? (
                <ErrorBlock label="Could not load recent orders" onRetry={refetchOrders} />
              ) : recentOrders.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <ShoppingCart size={28} className="text-foreground mx-auto mb-2" />
                  <p className="text-sm text-foreground-muted font-medium">No orders yet</p>
                  <p className="text-xs text-foreground-muted">Orders will appear here once placed</p>
                </div>
              ) : (
                recentOrders.map((order, i) => {
                  const statusCfg = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.held;
                  return (
                    <div
                      key={order.id}
                      className={`flex items-center gap-3 px-5 py-3 hover:bg-surface-elevated/50 transition-colors ${i < recentOrders.length - 1 ? "border-b border-border" : ""}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground">
                          {order.orderNumber ?? order.id.slice(0, 8)}
                        </p>
                        <p className="text-[10px] text-foreground-muted">
                          {order.customer?.name ?? "Walk-in customer"}
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-foreground">
                        {formatCurrency(Number(order.total) || 0)}
                      </p>
                      <StatusBadge config={statusCfg} />
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </motion.div>

        {/* Right column: Low Stock + Quick Actions */}
        <motion.div variants={ITEM} className="space-y-4">
          {/* Low Stock Alert */}
          <Card padding="none">
            <div className="px-4 py-3 flex justify-between items-center border-b border-border">
              <div className="flex items-center gap-2">
                <AlertTriangle size={13} className="text-warning" />
                <h3 className="text-xs font-semibold text-foreground">Stock Alerts</h3>
              </div>
              <Button variant="ghost" size="xs" onClick={() => navigate("/inventory")}>View →</Button>
            </div>
            <div className="p-2">
              {productsLoading ? (
                Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-2 animate-pulse">
                    <div className="w-7 h-7 rounded-lg bg-surface-elevated shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton width="70%" height={10} />
                      <Skeleton width="40%" height={8} />
                    </div>
                    <Skeleton width={36} height={18} className="rounded-full" />
                  </div>
                ))
              ) : lowStockProducts.length === 0 ? (
                <div className="px-2 py-5 text-center">
                  <Package size={20} className="text-foreground mx-auto mb-1" />
                  <p className="text-xs text-foreground-muted">All products in stock</p>
                </div>
              ) : (
                lowStockProducts.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-surface-elevated transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                      <Package size={12} className="text-warning" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-[10px] text-foreground-muted">{p.stock ?? 0} left</p>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-warning/10 text-warning">
                      Low
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card padding="sm">
            <h3 className="text-xs font-semibold text-foreground mb-3">Quick Actions</h3>
            <div className="space-y-1.5">
              {[
                { label: "Create new order", icon: <ShoppingCart size={12} />, path: "/orders" },
                { label: "View all customers", icon: <Users size={12} />, path: "/customers" },
                { label: "Check analytics", icon: <BarChart2 size={12} />, path: "/analytics" },
                { label: "Manage inventory", icon: <Package size={12} />, path: "/inventory" },
              ].map((action) => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-surface-elevated transition-colors group"
                >
                  <span className="text-foreground-muted group-hover:text-primary transition-colors">
                    {action.icon}
                  </span>
                  <span className="text-xs text-foreground-muted group-hover:text-foreground transition-colors">
                    {action.label}
                  </span>
                  <ArrowRight size={10} className="ml-auto text-foreground-muted group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
