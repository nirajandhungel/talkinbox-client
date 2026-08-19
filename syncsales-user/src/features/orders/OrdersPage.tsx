import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, ShoppingCart, Download, Plus,
  Clock, Package, CheckCircle, XCircle,
  MoreHorizontal
} from "lucide-react";
import { ordersApi } from "@/api";
import { QUERY_KEYS, ORDER_STATUS_CONFIG, PLATFORM_CONFIG, PAYMENT_STATUS_CONFIG } from "@/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useSearch, usePagination } from "@/hooks";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { SkeletonTable } from "@/components/feedback/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useToast } from "@/components/feedback/Toast";
import { useConfirmDialog } from "@/store";
import type { Order, OrderStatus } from "@/types";

// ─── Status Filter Options ───────────────────────────────────────

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Held", value: "held" },
  { label: "Pending Payment", value: "pending_payment" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const STATUS_KPI: { key: OrderStatus; label: string; icon: typeof Clock; tone: "warning" | "info" | "success" }[] = [
  { key: "pending_payment", label: "Pending", icon: Clock, tone: "warning" },
  { key: "confirmed", label: "Confirmed", icon: Package, tone: "info" },
  { key: "completed", label: "Completed", icon: CheckCircle, tone: "success" },
];

// ─── Quick Action Menu ────────────────────────────────────────────

function OrderRowActions({
  order,
  onStatusChange,
  onCancel,
}: {
  order: Order;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onCancel: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const nextStatus: Record<string, OrderStatus | null> = {
    held: "pending_payment",
    pending_payment: "confirmed",
    confirmed: "completed",
  };

  const next = nextStatus[order.status];

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors text-foreground-muted hover:text-foreground-muted"
      >
        <MoreHorizontal size={15} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-8 z-40 bg-surface rounded-xl border border-border shadow-lg py-1.5 min-w-[180px]"
            >
              {next && (
                <button
                  onClick={() => { onStatusChange(order.id, next); setOpen(false); }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary-hover transition-colors flex items-center gap-2"
                >
                  <CheckCircle size={13} className="text-primary-500" />
                  Mark as {next}
                </button>
              )}
              {["held", "pending_payment", "confirmed"].includes(order.status) && (
                <button
                  onClick={() => { onCancel(order.id); setOpen(false); }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-error hover:bg-error/10 transition-colors flex items-center gap-2"
                >
                  <XCircle size={13} />
                  Cancel Order
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Orders Page ─────────────────────────────────────────────

export default function OrdersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const { search, setSearch, debouncedSearch } = useSearch();
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const { success, error: toastError } = useToast();
  const confirm = useConfirmDialog();

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.orders, { page, pageSize, search: debouncedSearch, status: statusFilter }],
    queryFn: () => ordersApi.getAll({ page, pageSize, search: debouncedSearch, status: statusFilter }),
  });

  // Fetch all orders for KPI counts (without filters)
  const { data: allOrdersData } = useQuery({
    queryKey: [...QUERY_KEYS.orders, "counts"],
    queryFn: () => ordersApi.getAll({ page: 1, pageSize: 100 }),
  });

  const orders = data?.data ?? [];
  const allOrders = allOrdersData?.data ?? [];

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { held: 0, pending_payment: 0, confirmed: 0, completed: 0, cancelled: 0 };
    allOrders.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return counts;
  }, [allOrders]);

  const todayRevenue = useMemo(() => {
    return allOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total, 0);
  }, [allOrders]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      success(`Order ${updatedOrder.id} marked as ${updatedOrder.status}`);
    },
    onError: () => toastError("Failed to update order"),
  });

  const handleStatusChange = (id: string, status: OrderStatus) => {
    statusMutation.mutate({ id, status });
  };

  const handleCancel = (id: string) => {
    confirm.confirm({
      title: `Cancel Order ${id}?`,
      description: "This will cancel the order and notify the customer. This action cannot be undone.",
      variant: "danger",
      onConfirm: () => statusMutation.mutate({ id, status: "cancelled" }),
    });
  };

  const handleExport = () => {
    // Generate CSV
    const headers = ["Order ID", "Customer", "Platform", "Items", "Total", "Payment", "Status", "Date"];
    const rows = allOrders.map(o => [
      o.id,
      o.customer?.name || "Walk-in",
      PLATFORM_CONFIG[o.platform]?.label || o.platform,
      o.items.map(i => i.name).join("; "), o.total, `${o.payment} (${o.paymentStatus})`, o.status, formatDate(o.date)
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    success("Orders exported as CSV");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 max-w-[1200px]"
    >
      {/* ─── Page Header ────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-foreground">Orders</h2>
          <p className="text-[11px] sm:text-xs text-foreground-muted mt-0.5">
            {data?.total ?? 0} total orders · {formatCurrency(todayRevenue)} total revenue
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<Download size={13} />} onClick={handleExport} className="hidden sm:inline-flex">
            Export CSV
          </Button>
          <Button size="sm" icon={<Plus size={13} />} onClick={() => success("Create order — coming soon")}>
            <span className="hidden sm:inline">New Order</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* ─── KPI Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUS_KPI.map((kpi) => {
          const count = statusCounts[kpi.key] || 0;
          const isActive = statusFilter === kpi.key;
          const KpiIcon = kpi.icon;
          return (
            <motion.div
              key={kpi.key}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                hoverable
                onClick={() => { setStatusFilter(isActive ? "all" : kpi.key); setPage(1); }}
                className={`transition-all ${isActive ? "ring-2 ring-primary ring-offset-1 border-primary/30" : ""}`}
                padding="sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider">{kpi.label}</p>
                    <p className="text-2xl font-bold text-foreground font-mono mt-1">{count}</p>
                  </div>
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    kpi.tone === "warning" && "bg-warning/10 text-warning",
                    kpi.tone === "info" && "bg-primary-soft text-primary",
                    kpi.tone === "success" && "bg-success/10 text-success",
                  )}>
                    <KpiIcon size={20} />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ─── Status Tabs ────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {STATUS_OPTIONS.map((opt) => {
          const isActive = statusFilter === opt.value;
          const count = opt.value === "all" ? allOrders.length : statusCounts[opt.value] || 0;
          return (
            <button
              key={opt.value}
              onClick={() => { setStatusFilter(opt.value); setPage(1); }}
              className={`relative px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                isActive ? "text-primary" : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {opt.label}
              {count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? "bg-primary/20 text-primary" : "bg-surface-elevated text-foreground-muted"
                }`}>
                  {count}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary text-primary-foreground rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Search & Filters ───────────────────────────── */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            prefix={<Search size={13} />}
            containerClassName="flex-1 min-w-[160px] sm:min-w-[280px]"
          />
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            containerClassName="w-full sm:w-36"
          />
        </div>
      </Card>

      {/* ─── Orders Table ───────────────────────────────── */}
      {isLoading ? (
        <SkeletonTable rows={7} />
      ) : orders.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ShoppingCart size={28} />}
            title="No orders found"
            description={search || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Orders will appear here when customers place them."
            }
          />
        </Card>
      ) : (
        <Card padding="none">
          {/* Desktop: full table | Mobile: card layout */}
          <div className="overflow-x-auto">
            <table className="w-full mobile-card-table">
              <thead>
                <tr className="border-b border-border bg-surface-elevated/50">
                  {["Order", "Customer", "Platform", "Items", "Total", "Payment", "Status", "Date", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-semibold text-foreground-muted uppercase tracking-wider first:pl-5 last:pr-5"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                  {orders.map((order, i) => {
                    const platformCfg = PLATFORM_CONFIG[order.platform];
                    const statusCfg = ORDER_STATUS_CONFIG[order.status];
                    return (
                      <tr
                        key={order.id}
                        onClick={() => navigate(`/orders/${order.id.replace("#", "")}`)}
                        className={`${i < orders.length - 1 ? "md:border-b md:border-border" : ""} hover:bg-surface-elevated/80 transition-colors cursor-pointer group`}
                      >
                        <td className="px-4 py-3 md:pl-5">
                          <span className="text-xs font-bold text-primary font-mono group-hover:underline">
                            {order.id}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-primary/10 flex items-center justify-center text-[9px] md:text-[10px] font-bold text-primary-hover shrink-0">
                              {(order.customer?.name || "Gu").split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </div>
                            <span className="text-xs font-medium text-foreground truncate">{order.customer?.name || "Guest"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Badge color={platformCfg?.color}>{platformCfg?.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground-muted hidden lg:table-cell">
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold text-foreground font-mono">
                            {formatCurrency(order.total)}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <Badge tone={(PAYMENT_STATUS_CONFIG[order.paymentStatus] ?? PAYMENT_STATUS_CONFIG.pending).tone}>
                            {order.payment} · {(PAYMENT_STATUS_CONFIG[order.paymentStatus] ?? PAYMENT_STATUS_CONFIG.pending).label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge config={statusCfg} />
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground-muted hidden md:table-cell">{formatDate(order.date)}</td>
                        <td className="px-4 py-3 md:pr-5">
                          <OrderRowActions
                            order={order}
                            onStatusChange={handleStatusChange}
                            onCancel={handleCancel}
                          />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <div className="px-3 sm:px-4 py-3 border-t border-border">
            <Pagination
              page={page}
              totalPages={data?.totalPages ?? 1}
              total={data?.total ?? 0}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            />
          </div>
        </Card>
      )}
    </motion.div>
  );
}
