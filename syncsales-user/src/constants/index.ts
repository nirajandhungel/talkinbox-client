import type { Platform, OrderStatus, CustomerTier, StockStatus } from "@/types";

export const APP_NAME = "SyncSales";
export const APP_VERSION = "3.0.0";

export const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; bg: string }> = {
  whatsapp: { label: "WhatsApp", color: "#25D366", bg: "#f0fdf4" },
  instagram: { label: "Instagram", color: "#E1306C", bg: "#fff0f4" },
  facebook: { label: "Facebook", color: "#1877F2", bg: "#eff6ff" },
  tiktok: { label: "TikTok", color: "#010101", bg: "#f8fafc" },
  email: { label: "Email", color: "#6B7280", bg: "#f9fafb" },
  daraz: { label: "Daraz", color: "#F36100", bg: "#fff7ed" },
  website: { label: "Website", color: "#8B5CF6", bg: "#f5f3ff" },
};

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "#F59E0B", bg: "#fffbeb" },
  processing: { label: "Processing", color: "#3B82F6", bg: "#eff6ff" },
  shipped: { label: "Shipped", color: "#8B5CF6", bg: "#f5f3ff" },
  delivered: { label: "Delivered", color: "#10B981", bg: "#f0fdf4" },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "#fef2f2" },
  returned: { label: "Returned", color: "#6B7280", bg: "#f9fafb" },
};

export const STOCK_STATUS_CONFIG: Record<StockStatus, { label: string; color: string; bg: string }> = {
  active: { label: "In Stock", color: "#10B981", bg: "#f0fdf4" },
  low: { label: "Low Stock", color: "#F59E0B", bg: "#fffbeb" },
  critical: { label: "Critical", color: "#EF4444", bg: "#fef2f2" },
  out: { label: "Out of Stock", color: "#6B7280", bg: "#f9fafb" },
};

export const TIER_CONFIG: Record<CustomerTier, { color: string; bg: string }> = {
  Bronze: { color: "#92400E", bg: "#fef3c7" },
  Silver: { color: "#475569", bg: "#f1f5f9" },
  Gold: { color: "#B45309", bg: "#fffbeb" },
  Platinum: { color: "#6D28D9", bg: "#f5f3ff" },
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
