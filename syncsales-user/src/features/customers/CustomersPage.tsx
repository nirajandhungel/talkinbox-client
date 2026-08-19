import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search, Users, UserPlus, TrendingUp, ChevronRight,
  Mail, Phone, MapPin, ShoppingBag, MessageSquare, X,
  ArrowLeft, Calendar
} from "lucide-react";
import { customersApi } from "@/api";
import { QUERY_KEYS, PLATFORM_CONFIG, TIER_CONFIG } from "@/constants";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useSearch, usePagination } from "@/hooks";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Pagination } from "@/components/ui/Pagination";
import { SkeletonTable } from "@/components/feedback/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useToast } from "@/components/feedback/Toast";
import type { Customer } from "@/types";

// ─── Tier KPI Cards ──────────────────────────────────────────────

const TIER_KPI: { key: Customer["tier"]; icon: string; tone: "primary" | "warning" | "muted" }[] = [
  { key: "Platinum", icon: "💎", tone: "primary" },
  { key: "Gold", icon: "🥇", tone: "warning" },
  { key: "Silver", icon: "🥈", tone: "muted" },
  { key: "Bronze", icon: "🥉", tone: "warning" },
];

// ─── Customer Detail Drawer ──────────────────────────────────────

function CustomerDetailDrawer({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) {
  const { success, info } = useToast();
  const pfCfg = PLATFORM_CONFIG[customer.platform];
  const tierCfg = TIER_CONFIG[customer.tier];

  const handleContact = (method: string) => {
    if (method === "email") {
      window.open(`mailto:${customer.email}`, "_blank");
    } else if (method === "phone") {
      window.open(`tel:${customer.phone}`, "_blank");
    } else if (method === "platform") {
      const links: Record<string, string> = {
        whatsapp: `https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`,
        instagram: "https://www.instagram.com/direct/inbox/",
        facebook: "https://www.facebook.com/messages/",
        tiktok: "https://www.tiktok.com/messages",
        email: `mailto:${customer.email}`,
      };
      window.open(links[customer.platform] || "#", "_blank");
    }
    success(`Opening ${method} for ${customer.name}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/20 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-md bg-surface shadow-2xl overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-surface z-10 px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeft size={15} className="text-foreground-muted" />
            <h3 className="text-sm font-bold text-foreground">Customer Details</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-elevated text-foreground-muted transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Profile Section */}
        <div className="px-5 py-5">
          <div className="flex items-center gap-4">
            <Avatar name={customer.name} size="lg" />
            <div>
              <h2 className="text-lg font-bold text-foreground">{customer.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge color={pfCfg.color}>{pfCfg.label}</Badge>
                <Badge tone={tierCfg.tone}>
                  {customer.tier === "Platinum" ? "💎" : customer.tier === "Gold" ? "🥇" : "⭐"} {customer.tier}
                </Badge>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3 text-sm text-foreground-muted">
              <Mail size={14} className="text-foreground-muted" />
              <span>{customer.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground-muted">
              <Phone size={14} className="text-foreground-muted" />
              <span>{customer.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground-muted">
              <MapPin size={14} className="text-foreground-muted" />
              <span>{customer.address}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground-muted">
              <Calendar size={14} className="text-foreground-muted" />
              <span>Joined {customer.joinDate}</span>
            </div>
          </div>

          {/* Contact Actions */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Button variant="outline" size="xs" icon={<Mail size={12} />} onClick={() => handleContact("email")} className="text-xs">
              Email
            </Button>
            <Button variant="outline" size="xs" icon={<Phone size={12} />} onClick={() => handleContact("phone")} className="text-xs">
              Call
            </Button>
            <Button variant="outline" size="xs" icon={<MessageSquare size={12} />} onClick={() => handleContact("platform")} className="text-xs">
              {pfCfg.label}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-5 grid grid-cols-3 gap-3">
          <Card padding="sm" className="text-center">
            <p className="text-lg font-bold text-primary font-mono">{customer.totalOrders}</p>
            <p className="text-[10px] text-foreground-muted mt-0.5">Orders</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-lg font-bold text-foreground font-mono">{formatCurrency(customer.totalSpent)}</p>
            <p className="text-[10px] text-foreground-muted mt-0.5">Total Spent</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-lg font-bold text-foreground font-mono">
              {customer.totalOrders > 0 ? formatCurrency(Math.round(customer.totalSpent / customer.totalOrders)) : "—"}
            </p>
            <p className="text-[10px] text-foreground-muted mt-0.5">Avg. Order</p>
          </Card>
        </div>

        {/* Lifetime Value Progress */}
        <div className="px-5 mt-5">
          <Card>
            <CardHeader title="Lifetime Value" subtitle={`${customer.tier} tier customer`} />
            <div className="mt-2">
              <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((customer.totalSpent / 50000) * 100, 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-foreground-muted">
                <span>NPR 0</span>
                <span>NPR 50,000</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Notes */}
        {customer.notes && (
          <div className="px-5 mt-4">
            <Card>
              <CardHeader title="Notes" />
              <p className="text-sm text-foreground-muted">{customer.notes}</p>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="px-5 mt-4 pb-6 space-y-2">
          <button
            onClick={() => info("Order history — coming soon")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-elevated transition-colors text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center">
              <ShoppingBag size={14} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">View Order History</p>
              <p className="text-xs text-foreground-muted">{customer.totalOrders} orders total</p>
            </div>
            <ChevronRight size={14} className="text-foreground-muted group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => info("Spending analytics — coming soon")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-elevated transition-colors text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp size={14} className="text-success" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Spending Analytics</p>
              <p className="text-xs text-foreground-muted">Purchase trends & insights</p>
            </div>
            <ChevronRight size={14} className="text-foreground-muted group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Customers Page ─────────────────────────────────────────

export default function CustomersPage() {
  const { search, setSearch, debouncedSearch } = useSearch();
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [tierFilter, setTierFilter] = useState<string>("all");
  const { success } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.customers, { page, pageSize, search: debouncedSearch }],
    queryFn: () => customersApi.getAll({ page, pageSize, search: debouncedSearch }),
  });

  // Get all customers for tier counts
  const { data: allData } = useQuery({
    queryKey: [...QUERY_KEYS.customers, "all"],
    queryFn: () => customersApi.getAll({ page: 1, pageSize: 100 }),
  });

  const allCustomers = allData?.data ?? [];
  const customers = data?.data ?? [];

  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allCustomers.forEach((c) => { counts[c.tier] = (counts[c.tier] || 0) + 1; });
    return counts;
  }, [allCustomers]);

  const totalLTV = useMemo(() => allCustomers.reduce((s, c) => s + c.totalSpent, 0), [allCustomers]);

  const filteredCustomers = tierFilter === "all"
    ? customers
    : customers.filter((c) => c.tier === tierFilter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 max-w-[1200px]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-foreground">Customers</h2>
          <p className="text-[11px] sm:text-xs text-foreground-muted mt-0.5">
            {data?.total ?? 0} total customers · {formatCurrency(totalLTV)} lifetime value
          </p>
        </div>
        <Button size="sm" icon={<UserPlus size={13} />} onClick={() => success("Add customer — coming soon")}>
          <span className="hidden sm:inline">Add Customer</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Tier KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TIER_KPI.map((tier) => {
          const count = tierCounts[tier.key] || 0;
          const isActive = tierFilter === tier.key;
          return (
            <motion.div key={tier.key} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
              <Card
                hoverable
                onClick={() => { setTierFilter(isActive ? "all" : tier.key); setPage(1); }}
                className={cn(
                  "transition-all",
                  isActive && "ring-2 ring-primary ring-offset-1 border-primary/30",
                )}
                padding="sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-foreground-muted">{tier.key}</p>
                    <p className="text-2xl font-bold text-foreground font-mono mt-1">{count}</p>
                  </div>
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                    tier.tone === "primary" && "bg-primary-soft",
                    tier.tone === "warning" && "bg-warning/10",
                    tier.tone === "muted" && "bg-surface-elevated",
                  )}>
                    {tier.icon}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Search */}
      <Card padding="sm">
        <Input
          placeholder="Search by name, email, phone, or platform..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          prefix={<Search size={13} />}
        />
      </Card>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={6} />
      ) : filteredCustomers.length === 0 ? (
        <Card>
          <EmptyState icon={<Users size={28} />} title="No customers found" description="Customers will appear here as you grow." />
        </Card>
      ) : (
        <Card padding="none">
          <table className="w-full mobile-card-table">
            <thead>
              <tr className="border-b border-border bg-surface-elevated/50">
                {["Customer", "Contact", "Platform", "Orders", "Total Spent", "Tier", "Last Order", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c, i) => {
                const pfCfg = PLATFORM_CONFIG[c.platform];
                const cTierCfg = TIER_CONFIG[c.tier];
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className={`${i < filteredCustomers.length - 1 ? "md:border-b md:border-border" : ""} hover:bg-surface-elevated/80 transition-colors cursor-pointer group`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={c.avatar} size="sm" />
                        <div>
                          <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{c.name}</p>
                          <p className="text-[10px] text-foreground-muted">Joined {c.joinDate}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-foreground">{c.email}</p>
                      <p className="text-[10px] text-foreground-muted">{c.phone}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge color={pfCfg.color}>{pfCfg.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-foreground">{c.totalOrders}</td>
                    <td className="px-4 py-3 text-xs font-bold text-foreground font-mono">{formatCurrency(c.totalSpent)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={cTierCfg.tone}>{c.tier}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground-muted hidden lg:table-cell">{c.lastOrder}</td>
                    <td className="px-4 py-3">
                      <ChevronRight size={14} className="text-foreground-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border">
            <Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
          </div>
        </Card>
      )}

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <CustomerDetailDrawer customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
      )}
    </motion.div>
  );
}
