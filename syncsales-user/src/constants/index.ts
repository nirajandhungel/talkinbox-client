import type { Platform, OrderStatus, CustomerTier, StockStatus } from "@/types";
import type { BadgeTone } from "@/components/ui/Badge";

export const APP_NAME = "SyncSales";
export const APP_VERSION = "3.0.0";

export const PLATFORM_CONFIG: Record<Platform, { label: string; color: string }> = {
  whatsapp: { label: "WhatsApp", color: "#25D366" },
  instagram: { label: "Instagram", color: "#E1306C" },
  facebook: { label: "Facebook", color: "#1877F2" },
  tiktok: { label: "TikTok", color: "#A7B0AA" },
  email: { label: "Email", color: "#66716A" },
  daraz: { label: "Daraz", color: "#F36100" },
  website: { label: "Website", color: "#00C94A" },
};

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  held: { label: "Held", tone: "warning" },
  pending_payment: { label: "Pending Payment", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "info" },
  cancelled: { label: "Cancelled", tone: "error" },
  expired: { label: "Expired", tone: "muted" },
  no_show: { label: "No Show", tone: "error" },
  completed: { label: "Completed", tone: "success" },
  returned: { label: "Returned", tone: "muted" },
};

export const STOCK_STATUS_CONFIG: Record<StockStatus, { label: string; tone: BadgeTone }> = {
  active: { label: "In Stock", tone: "success" },
  low: { label: "Low Stock", tone: "warning" },
  critical: { label: "Critical", tone: "error" },
  out: { label: "Out of Stock", tone: "muted" },
};

export const TIER_CONFIG: Record<CustomerTier, { label: CustomerTier; tone: BadgeTone }> = {
  Bronze: { label: "Bronze", tone: "warning" },
  Silver: { label: "Silver", tone: "muted" },
  Gold: { label: "Gold", tone: "warning" },
  Platinum: { label: "Platinum", tone: "primary" },
};

export const PAYMENT_STATUS_CONFIG: Record<string, { label: string; tone: BadgeTone }> = {
  paid: { label: "Paid", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  refunded: { label: "Refunded", tone: "muted" },
};

export const TX_TYPE_CONFIG: Record<string, { label: string; tone: BadgeTone }> = {
  revenue: { label: "Revenue", tone: "success" },
  expense: { label: "Expense", tone: "error" },
};

export const TX_STATUS_CONFIG: Record<string, { label: string; tone: BadgeTone }> = {
  reconciled: { label: "Reconciled", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
};

export const CURRENCY = { symbol: "NPR", code: "NPR" };

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const DEBOUNCE_DELAY = 300;

export const QUERY_KEYS = {
  dashboard: ["dashboard"] as const,
  orders: ["orders"] as const,
  order: (id: string) => ["orders", id] as const,
  customers: ["customers"] as const,
  customer: (id: string) => ["customers", id] as const,
  products: ["products"] as const,
  product: (id: string) => ["products", id] as const,
  conversations: ["conversations"] as const,
  messages: (id: string) => ["messages", id] as const,
  transactions: ["transactions"] as const,
  analytics: ["analytics"] as const,
  revenue: (period: string) => ["analytics", "revenue", period] as const,
} as const;

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", path: "/" },
  { id: "inbox", label: "Inbox", icon: "MessageSquare", path: "/inbox" },
  { id: "orders", label: "Orders", icon: "ShoppingCart", path: "/orders" },
  { id: "inventory", label: "Inventory", icon: "Package", path: "/inventory" },
  { id: "customers", label: "Customers", icon: "Users", path: "/customers" },
  { id: "analytics", label: "Analytics", icon: "BarChart2", path: "/analytics" },
  { id: "accounting", label: "Accounting", icon: "BookOpen", path: "/accounting" },
  { id: "automation", label: "Automation", icon: "Zap", path: "/automation" },
  { id: "integrations", label: "Integrations", icon: "Plug", path: "/integrations" },
  { id: "settings", label: "Settings", icon: "Settings", path: "/settings" },
] as const;
