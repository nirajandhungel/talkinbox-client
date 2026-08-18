// ─── Domain Types ────────────────────────────────────────────────

export type Platform = "whatsapp" | "instagram" | "facebook" | "tiktok" | "email" | "daraz" | "website";
export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";
export type PaymentStatus = "paid" | "pending" | "refunded" | "failed";
export type StockStatus = "active" | "low" | "critical" | "out";
export type CustomerTier = "Bronze" | "Silver" | "Gold" | "Platinum";
export type TransactionType = "revenue" | "expense";
export type UserRole = "owner" | "manager" | "staff" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  businessName: string;
  plan: "starter" | "pro" | "enterprise";
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  variants: string[];
  status: StockStatus;
  image?: string;
  imageUrl?: string | null;
  sold: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId?: string;
  name: string;
  qty: number;
  price: number;
  size: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  customer?: { id: string; name: string; email: string };
  customerId: string | null;
  items: OrderItem[];
  subtotal: number;
  delivery: number;
  discount: number;
  total: number;
  status: OrderStatus;
  payment: string;
  paymentStatus: PaymentStatus;
  date: string;
  platform: Platform;
  address: string;
  note: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
  platform: Platform;
  avatar: string;
  tier: CustomerTier;
  joinDate: string;
  address: string;
  notes: string;
}

export interface Message {
  id: string;
  sender: "customer" | "ai" | "human";
  text: string;
  time: string;
  status?: "sent" | "delivered" | "read";
}

export interface Conversation {
  id: string;
  name: string;
  platform: Platform;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  aiHandled: boolean;
  status: "active" | "resolved" | "pending";
  customerId?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  platform: string;
  status: "reconciled" | "pending";
}

export interface MonthlyFinancial {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface ExpenseBreakdown {
  category: string;
  amount: number;
  color: string;
}

export interface CashFlow {
  week: string;
  inflow: number;
  outflow: number;
}

export interface DashboardStats {
  todayOrders: number;
  weekRevenue: number;
  totalCustomers: number;
  lowStockCount: number;
  generatedAt: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  platforms: string[];
  triggered: number;
  active: boolean;
  createdAt?: string;
}

export interface Activity {
  id: string;
  type: string;
  icon: string;
  text: string;
  detail: string;
  time: string;
  color: string;
}

// ─── API / Pagination Types ───────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
}

// ─── UI Types ─────────────────────────────────────────────────────

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface FilterOption {
  label: string;
  value: string;
}
