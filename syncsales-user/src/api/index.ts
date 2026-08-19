/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  API Layer — All backend resource calls
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Every function maps 1:1 to a NestJS backend controller endpoint.
 *  All calls go through apiClient → NestJS backend → Supabase DB.
 *
 *  Frontend components import from here — NEVER from mock data files.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import apiClient from "@/api/client";
import type {
  Product,
  Order,
  Customer,
  Conversation,
  Message,
  Transaction,
  PaginatedResponse,
  PaginationParams,
  DashboardStats,
  MonthlyFinancial,
  ExpenseBreakdown,
  CashFlow,
  AutomationRule,
} from "@/types";

// ─── Dashboard / Analytics ────────────────────────────────────────────────────
// GET /api/v1/analytics/dashboard/summary
export const dashboardApi = {
  getStats: () => apiClient.get<DashboardStats>("/analytics/dashboard/summary"),
};

// ─── Products ─────────────────────────────────────────────────────────────────
// Backend: ProductsController — /api/v1/products

function mapProduct(p: Product & { imageUrl?: string | null }): Product {
  return {
    ...p,
    image: p.imageUrl || p.image || "📦",
    stock: p.stock ?? 0,
  };
}

export const productsApi = {
  getAll: async (params: PaginationParams & { lowStock?: boolean }) => {
    const qs = new URLSearchParams({
      page: String(params.page),
      limit: String(params.pageSize),
      ...(params.search ? { search: params.search } : {}),
      ...(params.lowStock ? { lowStock: "true" } : {}),
    });
    const res = await apiClient.get<PaginatedResponse<Product>>(`/products?${qs.toString()}`);
    return { ...res, data: (res?.data || []).map(mapProduct) };
  },

  getById: async (id: string) => mapProduct(await apiClient.get<Product>(`/products/${id}`)),

  create: (data: Omit<Product, "id" | "createdAt" | "updatedAt">) =>
    apiClient.post<Product>("/products", data),

  update: (id: string, data: Partial<Product>) =>
    apiClient.patch<Product>(`/products/${id}`, data),

  adjustStock: (id: string, delta: number) =>
    apiClient.patch<Product>(`/products/${id}/stock`, { delta }),

  delete: (id: string) =>
    apiClient.del<void>(`/products/${id}`),
};

// ─── Inventory (stock levels) ─────────────────────────────────────────────────
// Backend: InventoryController — /api/v1/inventory

export interface InventoryLevel {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  lowStockThreshold: number;
  status: "active" | "low" | "critical" | "out";
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
}

export const inventoryApi = {
  getLevels: (params?: { search?: string; warehouseId?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.warehouseId) qs.set("warehouseId", params.warehouseId);
    if (params?.status) qs.set("status", params.status);
    return apiClient.get<InventoryLevel[]>(`/inventory/levels?${qs.toString()}`);
  },

  adjustStock: (id: string, data: { delta: number; reason?: string }) =>
    apiClient.patch<InventoryLevel>(`/inventory/levels/${id}`, data),

  bulkAdjust: (adjustments: Array<{ id: string; delta: number; reason?: string }>) =>
    apiClient.patch<void>("/inventory/bulk-adjust", { adjustments }),

  getWarehouses: () =>
    apiClient.get<Warehouse[]>("/inventory/warehouses"),

  getProducts: () =>
    apiClient.get<Product[]>("/inventory/products"),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
// Backend: OrdersController — /api/v1/orders

export const ordersApi = {
  getAll: (params: PaginationParams & { status?: string }) => {
    const qs = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
      ...(params.search ? { search: params.search } : {}),
      ...(params.status && params.status !== "all" ? { status: params.status } : {}),
    });
    return apiClient.get<PaginatedResponse<Order>>(`/orders?${qs.toString()}`);
  },

  getById: (id: string) =>
    apiClient.get<Order>(`/orders/${id}`),

  create: (data: Omit<Order, "id">) =>
    apiClient.post<Order>("/orders", data),

  update: (id: string, data: Partial<Order>) =>
    apiClient.patch<Order>(`/orders/${id}`, data),

  updateStatus: (id: string, status: Order["status"]) =>
    apiClient.patch<Order>(`/orders/${id}`, { status }),

  cancel: (id: string) =>
    apiClient.post<Order>(`/orders/${id}/cancel`),

  getTimeline: (id: string) =>
    apiClient.get<Array<{ event: string; timestamp: string; actor?: string }>>(`/orders/${id}/timeline`),
};

// ─── Customers ────────────────────────────────────────────────────────────────
// Backend: CustomersController — /api/v1/customers

export const customersApi = {
  getAll: (params: PaginationParams) => {
    const qs = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
      ...(params.search ? { search: params.search } : {}),
    });
    return apiClient.get<PaginatedResponse<Customer>>(`/customers?${qs.toString()}`);
  },

  getById: (id: string) =>
    apiClient.get<Customer>(`/customers/${id}`),

  create: (data: Partial<Customer>) =>
    apiClient.post<Customer>("/customers", data),

  update: (id: string, data: Partial<Customer>) =>
    apiClient.patch<Customer>(`/customers/${id}`, data),

  delete: (id: string) =>
    apiClient.del<void>(`/customers/${id}`),
};

// ─── Inbox ────────────────────────────────────────────────────────────────────
// Backend: InboxController — /api/v1/inbox

function mapMessage(m: Message & { createdAt?: string }): Message {
  return {
    ...m,
    time: m.time ?? (m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""),
  };
}

export const inboxApi = {
  getConversations: (params: PaginationParams & { status?: string }) => {
    const qs = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
      ...(params.search ? { search: params.search } : {}),
      ...(params.status ? { status: params.status } : {}),
    });
    return apiClient.get<PaginatedResponse<Conversation>>(`/inbox/conversations?${qs.toString()}`);
  },

  getConversation: async (id: string) => {
    const conv = await apiClient.get<Conversation & { messages: (Message & { createdAt?: string })[] }>(
      `/inbox/conversations/${id}`,
    );
    return { ...conv, messages: (conv?.messages || []).map(mapMessage) };
  },

  sendMessage: async (conversationId: string, text: string) =>
    mapMessage(await apiClient.post<Message & { createdAt?: string }>(
      `/inbox/conversations/${conversationId}/messages`,
      { text },
    )),

  updateConversation: (id: string, data: Partial<Conversation>) =>
    apiClient.patch<Conversation>(`/inbox/conversations/${id}`, data),
};

// ─── Accounting ───────────────────────────────────────────────────────────────
// Backend: AccountingController — /api/v1/accounting

interface AccountingSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  monthlyData: MonthlyFinancial[];
  expenseBreakdown: ExpenseBreakdown[];
  cashFlow: CashFlow[];
}

interface JournalEntry {
  id: string;
  date: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  type: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
}

export const accountingApi = {
  getSummary: (from: string, to: string) =>
    apiClient.get<AccountingSummary>(`/accounting/summary?from=${from}&to=${to}`),

  getJournal: (from: string, to: string, page = 1) =>
    apiClient.get<PaginatedResponse<JournalEntry>>(`/accounting/journal?from=${from}&to=${to}&page=${page}`),

  getAccounts: () =>
    apiClient.get<Account[]>("/accounting/accounts"),

  getTransactions: (params: PaginationParams) => {
    const qs = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
    });
    return apiClient.get<PaginatedResponse<Transaction>>(`/accounting/journal?${qs.toString()}`);
  },
};

// ─── Analytics ────────────────────────────────────────────────────────────────
// Backend: AnalyticsController — /api/v1/analytics

interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

interface ChannelBreakdown {
  channel: string;
  revenue: number;
  orders: number;
  color: string;
}

interface CustomerOverview {
  week: string;
  uniqueCustomers: number;
  newCustomers: number;
  returningCustomers: number;
}

export const analyticsApi = {
  getRevenueOverview: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    return apiClient.get<RevenuePoint[]>(`/analytics/revenue/overview?${qs.toString()}`);
  },

  getRevenueByChannel: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    return apiClient.get<ChannelBreakdown[]>(`/analytics/revenue/channels?${qs.toString()}`);
  },

  getCustomersOverview: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    return apiClient.get<CustomerOverview[]>(`/analytics/customers/overview?${qs.toString()}`);
  },

  // Legacy aliases for pages that use the old API shape
  getRevenue: (period: "daily" | "weekly" | "monthly" | "yearly") => {
    const now = new Date();
    const from = new Date();
    switch (period) {
      case "daily": from.setDate(now.getDate() - 30); break;
      case "weekly": from.setDate(now.getDate() - 84); break;
      case "monthly": from.setMonth(now.getMonth() - 12); break;
      case "yearly": from.setFullYear(now.getFullYear() - 5); break;
    }
    return apiClient.get<RevenuePoint[]>(
      `/analytics/revenue/overview?from=${from.toISOString().split("T")[0]}&to=${now.toISOString().split("T")[0]}`
    );
  },

  getPlatformBreakdown: () =>
    apiClient.get<ChannelBreakdown[]>("/analytics/revenue/channels"),
};

// ─── Automation ───────────────────────────────────────────────────────────────
// Backend: AutomationController — /api/v1/automations

export const automationApi = {
  getRules: () =>
    apiClient.get<AutomationRule[]>("/automations/rules"),

  createRule: (data: Omit<AutomationRule, "id" | "triggered" | "createdAt">) =>
    apiClient.post<AutomationRule>("/automations/rules", data),

  updateRule: (id: string, data: Partial<AutomationRule>) =>
    apiClient.patch<AutomationRule>(`/automations/rules/${id}`, data),

  deleteRule: (id: string) =>
    apiClient.del<void>(`/automations/rules/${id}`),

  testRule: (id: string) =>
    apiClient.post<{ success: boolean; message: string }>(`/automations/rules/${id}/test`),

  getRuns: (ruleId?: string) => {
    const qs = ruleId ? `?ruleId=${ruleId}` : "";
    return apiClient.get<Array<{ id: string; ruleId: string; status: string; timestamp: string }>>(`/automations/runs${qs}`);
  },
};

// ─── AI ───────────────────────────────────────────────────────────────────────
// Backend: AiController — /api/v1/ai

interface AiReplyResponse {
  reply: string;
  simulated: boolean;
  model: string;
}

interface AiAnalyzeResponse {
  sentiment: string;
  intent: string;
  suggestions: string[];
}

interface AiStatusResponse {
  mode: "real" | "mock";
  model: string;
  message: string;
}

interface AiOwnerMessageResponse {
  aiReply: string;
  conversationId: string;
  messageId: string;
  simulated: boolean;
  model: string;
}

export interface AiModelOption {
  id: string;
  provider: string;
  name?: string;
}

interface AiModelsResponse {
  local_providers?: AiModelOption[];
  openrouter_models?: AiModelOption[];
}

export const aiApi = {
  generateReply: (conversationId: string, context?: string) =>
    apiClient.post<AiReplyResponse>("/ai/reply", { conversationId, context }),

  analyzeMessage: (message: string) =>
    apiClient.post<AiAnalyzeResponse>("/ai/analyze", { message }),

  getStatus: () =>
    apiClient.get<AiStatusResponse>("/ai/status"),

  getModels: () =>
    apiClient.get<AiModelsResponse>("/ai/models"),

  sendOwnerMessage: (customerId: string, prompt: string) =>
    apiClient.post<AiOwnerMessageResponse>("/ai/owner-message", { customerId, prompt }),

  simulate: (prompt: string, tone?: string, provider?: string, model?: string) =>
    apiClient.post<{ aiReply: string; simulated: boolean; model: string }>("/ai/simulate", { prompt, tone, provider, model }),

  getConversationHistory: (conversationId: string, limit = 20) =>
    apiClient.get<Message[]>(`/ai/conversations/${conversationId}/history?limit=${limit}`),
};

// ─── Users (for staff management) ─────────────────────────────────────────────
// Backend: UsersController — /api/v1/users

export const usersApi = {
  getMe: () => apiClient.get<{ id: string; email: string; firstName: string; lastName: string }>("/auth/me"),
};

// ─── Integrations ─────────────────────────────────────────────────────────────
export const integrationsApi = {
  getAccounts: () => apiClient.get<Array<Record<string, unknown>>>("/integrations/accounts"),
  connect: (platform: string, authType?: string, prompt?: string) =>
    apiClient.post<{ url: string }>("/integrations/connect", { platform, authType, prompt }),
  disconnect: (id: string) => apiClient.del<void>(`/integrations/${id}`),
  getMetaAvailableAccounts: () =>
    apiClient.get<Array<Record<string, unknown>>>("/integrations/meta/available-accounts"),
  selectMetaAccount: (accountId: string, platform: string, type: string) =>
    apiClient.post("/integrations/meta/accounts/select", { accountId, platform, type }),
};

// ─── Documents ────────────────────────────────────────────────────────────────
// Backend: DocumentsController — /api/v1/documents

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export const documentsApi = {
  getAll: (params: PaginationParams) => {
    const qs = new URLSearchParams({
      page: String(params.page),
      limit: String(params.pageSize),
      ...(params.search ? { search: params.search } : {}),
    });
    return apiClient.get<PaginatedResponse<Document>>(`/documents?${qs.toString()}`);
  },

  getById: (id: string) => apiClient.get<Document>(`/documents/${id}`),

  create: (data: Partial<Document>) => apiClient.post<Document>("/documents", data),

  update: (id: string, data: Partial<Document>) =>
    apiClient.patch<Document>(`/documents/${id}`, data),

  delete: (id: string) => apiClient.del<void>(`/documents/${id}`),
};
