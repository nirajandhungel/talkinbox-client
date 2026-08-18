import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft, Check, Truck, Package, Clock, Ban,
  FileText, Printer, MessageSquare, ExternalLink,
  ChevronRight, Copy, MapPin, CreditCard, Calendar,
  ShoppingBag, CheckCircle2, XCircle
} from "lucide-react";
import { ordersApi } from "@/api";
import { QUERY_KEYS, ORDER_STATUS_CONFIG, PLATFORM_CONFIG } from "@/constants";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/feedback/Toast";
import { useConfirmDialog } from "@/store";
import type { Order, OrderStatus } from "@/types";

// ─── Status Flow Configuration ────────────────────────────────────

const STATUS_FLOW: Record<string, OrderStatus | null> = {
  pending: "processing",
  processing: "shipped",
  shipped: "delivered",
  delivered: null,
  cancelled: null,
  returned: null,
};

const STATUS_ACTIONS: Record<string, { label: string; icon: typeof Check; variant: "primary" | "secondary" }> = {
  pending: { label: "Mark Processing", icon: Package, variant: "primary" },
  processing: { label: "Mark Shipped", icon: Truck, variant: "primary" },
  shipped: { label: "Mark Delivered", icon: Check, variant: "primary" },
};

const TIMELINE_STEPS: { key: OrderStatus; label: string; icon: typeof Clock }[] = [
  { key: "pending", label: "Order Placed", icon: ShoppingBag },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

const PLATFORM_LINKS: Record<string, (name: string) => string> = {
  whatsapp: (name) => `https://wa.me/?text=Hi%20${encodeURIComponent(name)}`,
  instagram: () => `https://www.instagram.com/direct/inbox/`,
  facebook: () => `https://www.facebook.com/messages/`,
  tiktok: () => `https://www.tiktok.com/messages`,
  email: (name) => `mailto:${name.toLowerCase().replace(/\s/g, "")}@gmail.com`,
};

// ─── Audit Log (Mock) ─────────────────────────────────────────────

function generateAuditLog(order: Order) {
  const logs = [
    { action: "Order created", user: "AI Bot", timestamp: order.date, icon: ShoppingBag, color: "#3B82F6" },
  ];
  const orderDate = new Date(order.date);
  const statuses: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];
  const idx = statuses.indexOf(order.status);

  if (order.status === "cancelled") {
    logs.push({
      action: "Order cancelled",
      user: "Sajjan Mahat",
      timestamp: new Date(orderDate.getTime() + 3600000).toISOString(),
      icon: XCircle,
      color: "#EF4444",
    });
  } else {
    if (idx >= 1) logs.push({ action: "Marked as processing", user: "Sajjan Mahat", timestamp: new Date(orderDate.getTime() + 1800000).toISOString(), icon: Package, color: "#3B82F6" });
    if (idx >= 2) logs.push({ action: "Marked as shipped", user: "System", timestamp: new Date(orderDate.getTime() + 7200000).toISOString(), icon: Truck, color: "#8B5CF6" });
    if (idx >= 3) logs.push({ action: "Marked as delivered", user: "Delivery Partner", timestamp: new Date(orderDate.getTime() + 86400000).toISOString(), icon: CheckCircle2, color: "#10B981" });
  }

  if (order.paymentStatus === "paid") {
    logs.splice(1, 0, {
      action: `Payment received via ${order.payment}`,
      user: "System",
      timestamp: new Date(orderDate.getTime() + 600000).toISOString(),
      icon: CreditCard,
      color: "#10B981",
    });
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ─── Invoice Generator (Mock PDF) ─────────────────────────────────

function generateInvoice(order: Order) {
  const invoiceContent = `
INVOICE — SyncSales Store
===============================
Invoice #: INV-${order.id.replace("#", "")}
Date: ${formatDate(order.date)}
Customer: ${order.customer?.name || "Walk-in"}
Address: ${order.address}
-------------------------------
ITEMS:
${order.items.map(i => `  ${i.name} (${i.size}) x${i.qty} — ${formatCurrency(i.price * i.qty)}`).join("\n")}
-------------------------------
Subtotal:  ${formatCurrency(order.subtotal)}
Delivery:  ${formatCurrency(order.delivery)}
${order.discount > 0 ? `Discount: -${formatCurrency(order.discount)}` : ""}
-------------------------------
TOTAL:     ${formatCurrency(order.total)}
-------------------------------
Payment: ${order.payment} · ${order.paymentStatus}
Platform: ${PLATFORM_CONFIG[order.platform]?.label || order.platform}
===============================
Thank you for your purchase!
  `.trim();

  const blob = new Blob([invoiceContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${order.id.replace("#", "")}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ───────────────────────────────────────────────

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: toastError, info } = useToast();
  const confirm = useConfirmDialog();
  const [isUpdating, setIsUpdating] = useState(false);

  const id = orderId ? `#${orderId}` : "";

  const { data: order, isLoading } = useQuery({
    queryKey: QUERY_KEYS.order(id),
    queryFn: () => ordersApi.getById(id),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      queryClient.setQueryData(QUERY_KEYS.order(updatedOrder.id), updatedOrder);
      success(`Order ${updatedOrder.id} marked as ${updatedOrder.status}`);
      setIsUpdating(false);
    },
    onError: () => {
      toastError("Failed to update order status");
      setIsUpdating(false);
    },
  });

  const auditLog = useMemo(() => (order ? generateAuditLog(order) : []), [order]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in max-w-[1200px]">
        <div className="h-8 w-32 skeleton rounded-lg" />
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <div className="h-64 skeleton rounded-xl" />
            <div className="h-48 skeleton rounded-xl" />
          </div>
          <div className="space-y-4">
            <div className="h-40 skeleton rounded-xl" />
            <div className="h-32 skeleton rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <ShoppingBag size={48} className="mb-4" />
        <p className="text-lg font-semibold">Order not found</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/orders")}>
          Back to Orders
        </Button>
      </div>
    );
  }

  const nextStatus = STATUS_FLOW[order.status];
  const actionConfig = STATUS_ACTIONS[order.status];
  const platformCfg = PLATFORM_CONFIG[order.platform];
  const statusCfg = ORDER_STATUS_CONFIG[order.status];
  const canCancel = ["pending", "processing"].includes(order.status);

  const handleAdvanceStatus = () => {
    if (!nextStatus) return;
    setIsUpdating(true);
    statusMutation.mutate({ id: order.id, status: nextStatus });
  };

  const handleCancelOrder = () => {
    confirm.confirm({
      title: `Cancel Order ${order.id}?`,
      description: "This will cancel the order and notify the customer. This action cannot be undone.",
      variant: "danger",
      onConfirm: () => {
        setIsUpdating(true);
        statusMutation.mutate({ id: order.id, status: "cancelled" });
      },
    });
  };

  const handleContactCustomer = () => {
    const linkFn = PLATFORM_LINKS[order.platform];
    if (linkFn && order.customer?.name) {
      window.open(linkFn(order.customer.name), "_blank");
    } else {
      info("Platform contact not available");
    }
  };

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    success("Order ID copied");
  };

  const currentStepIndex = TIMELINE_STEPS.findIndex(s => s.key === order.status);
  const isCancelled = order.status === "cancelled";
  const isReturned = order.status === "returned";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5 max-w-[1200px]"
    >
      {/* ─── Back + Header ──────────────────────────────── */}
      <button
        onClick={() => navigate("/orders")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Orders
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
            <ShoppingBag size={22} className="text-primary-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">{order.id}</h1>
              <button onClick={handleCopyOrderId} className="text-slate-400 hover:text-primary-600 transition-colors">
                <Copy size={14} />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
              <Calendar size={13} />
              <span>{formatDate(order.date)} at {formatTime(order.date)}</span>
              <span className="text-slate-300">•</span>
              <Badge color={platformCfg?.color} bg={platformCfg?.bg}>{platformCfg?.label}</Badge>
            </div>
            <div className="flex gap-2 mt-2">
              <StatusBadge config={statusCfg} />
              <Badge
                color={order.paymentStatus === "paid" ? "#10B981" : order.paymentStatus === "refunded" ? "#6B7280" : "#F59E0B"}
                bg={order.paymentStatus === "paid" ? "#f0fdf4" : order.paymentStatus === "refunded" ? "#f9fafb" : "#fffbeb"}
              >
                {order.payment} · {order.paymentStatus}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {actionConfig && nextStatus && (
            <Button
              variant={actionConfig.variant}
              size="sm"
              icon={<actionConfig.icon size={14} />}
              loading={isUpdating}
              onClick={handleAdvanceStatus}
            >
              {actionConfig.label}
            </Button>
          )}
          {canCancel && (
            <Button variant="danger" size="sm" icon={<Ban size={13} />} onClick={handleCancelOrder} disabled={isUpdating}>
              Cancel Order
            </Button>
          )}
          <Button variant="outline" size="sm" icon={<FileText size={13} />} onClick={() => { generateInvoice(order); success("Invoice downloaded"); }}>
            Invoice
          </Button>
          <Button variant="outline" size="sm" icon={<Printer size={13} />} onClick={() => { window.print(); info("Preparing print label..."); }}>
            Print Label
          </Button>
          <Button variant="outline" size="sm" icon={<MessageSquare size={13} />} onClick={handleContactCustomer}>
            Contact Customer
          </Button>
        </div>
      </div>

      {/* ─── Status Stepper ─────────────────────────────── */}
      {!isCancelled && !isReturned && (
        <Card>
          <div className="flex items-center justify-between px-2">
            {TIMELINE_STEPS.map((step, i) => {
              const isCompleted = currentStepIndex >= i;
              const isCurrent = currentStepIndex === i;
              const StepIcon = step.icon;
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isCurrent ? 1.1 : 1,
                        backgroundColor: isCompleted ? "#006D5B" : "#e2e8f0",
                      }}
                      transition={{ duration: 0.3 }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted ? "text-white shadow-sm" : "text-slate-400"
                      }`}
                    >
                      {isCompleted && i < currentStepIndex ? (
                        <Check size={18} />
                      ) : (
                        <StepIcon size={18} />
                      )}
                    </motion.div>
                    <span className={`text-xs font-medium ${isCurrent ? "text-primary-600" : isCompleted ? "text-slate-700" : "text-slate-400"}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div className="flex-1 mx-3">
                      <div className="h-0.5 rounded-full bg-slate-200 relative overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: currentStepIndex > i ? "100%" : "0%" }}
                          transition={{ duration: 0.5, delay: i * 0.1 }}
                          className="absolute inset-y-0 left-0 bg-primary-500 rounded-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {isCancelled && (
        <Card className="border-red-200 bg-red-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle size={20} className="text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-red-800">Order Cancelled</p>
              <p className="text-sm text-red-600">
                This order was cancelled{order.note ? `: ${order.note}` : "."}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ─── Main Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Order Items */}
          <Card>
            <CardHeader title="Order Items" subtitle={`${order.items.length} item${order.items.length !== 1 ? "s" : ""}`} />
            <div className="divide-y divide-slate-100">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-lg">
                      📦
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        Size: {item.size} · Qty: {item.qty} · {formatCurrency(item.price)} each
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800 font-mono">{formatCurrency(item.price * item.qty)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Breakdown */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              {[
                ["Subtotal", order.subtotal],
                ["Delivery Fee", order.delivery],
                ...(order.discount > 0 ? [["Discount", -order.discount] as [string, number]] : []),
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between text-sm">
                  <span className="text-slate-500">{label as string}</span>
                  <span className="font-mono text-slate-700">
                    {(value as number) < 0 ? "-" : ""}{formatCurrency(Math.abs(value as number))}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-3 mt-2 border-t border-slate-200">
                <span className="text-base font-bold text-slate-800">Total</span>
                <span className="text-base font-bold text-primary-600 font-mono">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </Card>

          {/* Audit / Order Timeline */}
          <Card>
            <CardHeader title="Order Timeline" subtitle="Activity log and status changes" />
            <div className="relative">
              <div className="absolute left-[15px] top-0 bottom-0 w-px bg-slate-200" />
              <div className="space-y-4">
                {auditLog.map((log, i) => {
                  const LogIcon = log.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex gap-3 relative"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white"
                        style={{ backgroundColor: `${log.color}18`, color: log.color }}
                      >
                        <LogIcon size={14} />
                      </div>
                      <div className="flex-1 pb-1">
                        <p className="text-sm font-medium text-slate-700">{log.action}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-500">by {log.user}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-400">
                            {formatDate(log.timestamp)} at {formatTime(log.timestamp)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Customer Info */}
          <Card>
            <CardHeader title="Customer" />
            <div className="flex items-center gap-3 mb-4">
              <Avatar name={order.customer?.name || "Guest"} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{order.customer?.name || "Guest"}</p>
                <Badge color={platformCfg?.color} bg={platformCfg?.bg} className="mt-1">{platformCfg?.label}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-600">{order.address}</p>
              </div>
              {order.customerId && (
                <button
                  onClick={() => navigate(`/customers`)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                >
                  <span className="text-xs font-medium text-slate-600">View customer profile</span>
                  <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>

            {/* Contact Buttons */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Contact</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  icon={<MessageSquare size={12} />}
                  onClick={handleContactCustomer}
                  className="text-xs"
                >
                  Message
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  icon={<ExternalLink size={12} />}
                  onClick={handleContactCustomer}
                  className="text-xs"
                >
                  {platformCfg?.label}
                </Button>
              </div>
            </div>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader title="Payment" />
            <div className="space-y-3">
              {[
                ["Method", order.payment],
                ["Status", order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)],
                ["Amount", formatCurrency(order.total)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-xs font-semibold text-slate-800">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div
                className={`px-3 py-2 rounded-lg text-xs font-medium text-center ${
                  order.paymentStatus === "paid"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : order.paymentStatus === "refunded"
                    ? "bg-slate-50 text-slate-600 border border-slate-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {order.paymentStatus === "paid" && "✓ Payment confirmed"}
                {order.paymentStatus === "pending" && "⏳ Payment pending"}
                {order.paymentStatus === "refunded" && "↩ Payment refunded"}
                {order.paymentStatus === "failed" && "✕ Payment failed"}
              </div>
            </div>
          </Card>

          {/* Order Note */}
          {order.note && (
            <Card>
              <CardHeader title="Order Note" />
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <p className="text-sm text-amber-800">{order.note}</p>
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader title="Quick Actions" />
            <div className="space-y-2">
              <button
                onClick={() => { generateInvoice(order); success("Invoice downloaded"); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText size={15} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Generate Invoice</p>
                  <p className="text-xs text-slate-400">Download PDF invoice</p>
                </div>
                <ChevronRight size={14} className="text-slate-300 ml-auto group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => { window.print(); info("Print label dialog opened"); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Printer size={15} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Print Shipping Label</p>
                  <p className="text-xs text-slate-400">Ready for courier</p>
                </div>
                <ChevronRight size={14} className="text-slate-300 ml-auto group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={handleContactCustomer}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <MessageSquare size={15} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Contact on {platformCfg?.label}</p>
                  <p className="text-xs text-slate-400">Open conversation</p>
                </div>
                <ChevronRight size={14} className="text-slate-300 ml-auto group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
