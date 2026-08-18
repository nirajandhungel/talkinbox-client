# SyncSales Frontend — Full Production Audit Report
> Generated: 2026-03-02 | Based on complete scan of all source files vs SyncSales_v2.jsx reference & SyncSales_Pitch_Deck.docx

---

## Table of Contents
1. [Critical Bugs & Rendering Issues](#1-critical-bugs--rendering-issues)
2. [Incomplete Features (Stubs / "Coming Soon")](#2-incomplete-features-stubs--coming-soon)
3. [Missing Pages & Routes](#3-missing-pages--routes)
4. [UI / UX Layout Issues](#4-ui--ux-layout-issues)
5. [Data & State Issues](#5-data--state-issues)
6. [Missing from SyncSales_v2.jsx Reference](#6-missing-from-syncsales_v2jsx-reference)
7. [Missing Product Features from Pitch Deck](#7-missing-product-features-from-pitch-deck)
8. [Component-Level Issues](#8-component-level-issues)
9. [Performance & Code Quality Issues](#9-performance--code-quality-issues)
10. [Mobile / Responsive Issues](#10-mobile--responsive-issues)
11. [Priority Fix List](#11-priority-fix-list)

---

## 1. CRITICAL BUGS & RENDERING ISSUES

### 1.1 Orders Page — Pending Filter KPI Click Bug
**File:** `src/features/orders/OrdersPage.tsx` lines 226–229  
**Issue:** The 4 Status KPI cards (Pending, Processing, Shipped, Delivered) call `setStatusFilter()` on click. However, the **Status Tabs row** (`STATUS_OPTIONS`) and the **KPI cards** maintain two separate "active" visual states but share the same `statusFilter` state. When a user clicks "Pending" KPI card, the tab row also highlights "Pending" — but the **orders table does NOT re-filter** on subsequent same-filter click (toggling deactivation only happens via KPI card, not the tab). This creates a confusing double-highlight with stale state.
**Fix needed:** Sync KPI card active state with tab via a single source of truth; add animated underline to tab on KPI card click.

### 1.2 Orders Page — KPI Count Wrong (Double Fetch)
**File:** `src/features/orders/OrdersPage.tsx` lines 127–134  
**Issue:** Two separate React Query calls — one paginated for display, one with `pageSize:1000` to count statuses. This is wasteful and the counts won't reflect real totals if orders exceed 1000. The `todayRevenue` KPI sums **all** orders (even delivered from all time) because there is no date filtering — it shows "total lifetime revenue" labelled as "today's revenue".
```tsx
// Line 142-146 — wrong label
const todayRevenue = useMemo(() => {
  return allOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0); // ← sums ALL orders, not today
}, [allOrders]);
```

### 1.3 Inbox Page — "Mark Resolved" Button Does Nothing
**File:** `src/features/inbox/InboxPage.tsx` line 149  
**Issue:** The "Mark Resolved" button is rendered but has no `onClick` handler. Clicking it does nothing — no state change, no toast, no API call.
```tsx
<Button variant="outline" size="xs">Mark Resolved</Button>  // ← no onClick!
```
**Fix:** Wire up to `inboxApi`, update conversation status, invalidate queries.

### 1.4 Inbox Page — "View Profile" Button Does Nothing
**File:** `src/features/inbox/InboxPage.tsx` line 150  
**Issue:** Same as above — no `onClick`. Should navigate to `/customers/${conv.customerId}` when `customerId` is set.

### 1.5 Inbox Page — No Conversation Context Panel (Right Panel Missing)
**File:** `src/features/inbox/InboxPage.tsx`  
**Issue:** The `SyncSales_v2.jsx` reference has a **3-column inbox layout** (conversation list | chat | context panel with customer info, order history, quick actions). The refactored version has only 2 columns — the **entire context panel is missing**.

### 1.6 CustomerDetailDrawer — "View Order History" is a Stub
**File:** `src/features/customers/CustomersPage.tsx` line 193  
```tsx
onClick={() => info("Order history — coming soon")} // ← produces coming soon toast
```
This is a stub. Should navigate to `/orders?customer=${customer.id}` or show filtered orders.

### 1.7 CustomerDetailDrawer — "Spending Analytics" is a Stub
**File:** `src/features/customers/CustomersPage.tsx` line 207
```tsx
onClick={() => info("Spending analytics — coming soon")} // ← stub
```

### 1.8 CustomerDetailDrawer — "View customer profile" Navigates Wrong
**File:** `src/features/orders/OrderDetailPage.tsx` line 485  
```tsx
onClick={() => navigate(`/customers`)} // ← goes to list, not specific customer
```
Should be `/customers/${order.customerId}` (or trigger the drawer with that customer pre-selected).

### 1.9 CreateCustomerDialog — Uses window.location.reload() After Create
**File:** `src/features/customers/CustomersPage.tsx` lines 392–396  
```tsx
onCreated={() => {
  window.setTimeout(() => {
    window.location.reload(); // ← full page reload is awful UX
  }, 300);
}}
```
Should use `queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers })` instead.

### 1.10 Inventory Page — "Add Product" is a Stub
**File:** `src/features/inventory/InventoryPage.tsx` line 84  
```tsx
onClick={() => success("Add product — coming soon")} // ← toast stub
```
The `v2.jsx` reference has a full product add/edit modal with all fields.

### 1.11 Inventory Page — Edit Product is Completely Missing
**Issue:** There is no way to edit a product. The table only has a delete button. No product detail view, no inline editing, no "edit" button — completely missing compared to `v2.jsx` which has a full `ProductModal` with all fields editable.

### 1.12 Inventory Page — Category Filter Does Not Wire to API
**File:** `src/features/inventory/InventoryPage.tsx` lines 37–40  
The `categoryFilter` state is set but never passed to the API call:
```tsx
const { data, isLoading } = useQuery({
  queryKey: [...QUERY_KEYS.products, { page, pageSize, search: debouncedSearch }],
  queryFn: () => productsApi.getAll({ page, pageSize, search: debouncedSearch }),
  // ← categoryFilter is NEVER passed!
});
```

### 1.13 Integrations Page — Connect/Disconnect Has No Real OS Effect
**File:** `src/features/integrations/IntegrationsPage.tsx`  
Toggling connected state is purely local React state. On page refresh all changes are lost. No persistence to any store.

### 1.14 Settings Page — Forms Are Uncontrolled (No Actual Saving)
**File:** `src/features/settings/SettingsPage.tsx`
- Store Settings form: uses `defaultValue` (uncontrolled) — changes cannot be read on save
- Password update: random inputs with no validation (no match check, no length check)
- Notification toggles: `defaultChecked` — uncontrolled, state lost on re-render
- Theme color picker: visual only, does nothing to CSS variables

### 1.15 Topbar — Search Input Does Nothing
**File:** `src/app/layout/Topbar.tsx` lines 46–54  
The global search input has no `onChange`, no state, and no navigation logic. It is a purely decorative element.

### 1.16 Topbar — Notifications are Hardcoded / Not Dismissible
**File:** `src/app/layout/Topbar.tsx` lines 75–88  
Notifications are hardcoded strings. The "3 new" badge is static. No "Mark all read", no dismiss individual, no real data.

### 1.17 Sidebar — Badges Are Hardcoded
**File:** `src/app/layout/Sidebar.tsx` lines 18–20  
```ts
{ id: "inbox", label: "Inbox", icon: "MessageSquare", path: "/inbox", badge: 7 },
{ id: "orders", label: "Orders", icon: "ShoppingCart", path: "/orders", badge: 3, warn: true },
```
Hardcoded `badge: 7` and `badge: 3` — these never update dynamically from actual data.

### 1.18 Revenue Page — Daily/Weekly Data Uses Math.random()
**File:** `src/lib/mockData.ts` lines 116–126  
```ts
export const revenueDaily = Array.from({ length: 30 }, (_, i) => ({
  revenue: Math.floor(Math.random() * 30000) + 10000, // ← random every render!
}));
```
Every React Query refetch regenerates random revenue data — charts visually "jump" on every re-render/refetch.

---

## 2. INCOMPLETE FEATURES (STUBS / "COMING SOON")

| # | Location | Feature | Stub Code |
|---|----------|---------|-----------|
| 1 | `InventoryPage.tsx:84` | Add Product | `success("Add product — coming soon")` |
| 2 | `AutomationPage.tsx:126` | New Automation | `info("New automation — coming soon")` |
| 3 | `IntegrationsPage.tsx:78` | Custom Integration | `info("Custom integration — coming soon")` |
| 4 | `IntegrationsPage.tsx:215` | n8n Configure | `info("n8n configuration opened")` |
| 5 | `CustomersPage.tsx:193` | Customer Order History | `info("Order history — coming soon")` |
| 6 | `CustomersPage.tsx:207` | Customer Spending Analytics | `info("Spending analytics — coming soon")` |
| 7 | `RevenuePage.tsx:52` | Export CSV (Revenue) | Button renders but no handler logic |
| 8 | `AccountingPage.tsx:51` | Export Accounting | Button renders but no handler logic |
| 9 | `InboxPage.tsx:149` | Mark Resolved | No `onClick` handler |
| 10 | `InboxPage.tsx:150` | View Profile from Inbox | No `onClick` handler |
| 11 | `SettingsPage.tsx:120-124` | Theme Color Picker | Visual only, no effect |
| 12 | `SettingsPage.tsx:128-131` | Language Selector | `<select>` with no state, no effect |
| 13 | `Topbar.tsx:46–54` | Global Search | Input exists but does nothing |
| 14 | `OrderDetailPage.tsx:297` | Invoice Download | Downloads `.txt` not a real PDF |
| 15 | `OrderDetailPage.tsx:300` | Print Label | Calls `window.print()` — prints entire page, not a shipping label |

---

## 3. MISSING PAGES & ROUTES

### 3.1 No 404 / Not Found Page
The router uses `{ path: "*", element: <Navigate to="/" replace /> }` which silently redirects — users never know the URL was wrong.

### 3.2 No Login / Authentication Page
The `useAuthStore` has a hardcoded user (`isAuthenticated: true`). There is no:
- Login page
- Auth guard / protected route logic
- Logout flow (button is missing from app entirely)

### 3.3 No Customer Detail Page (Dedicated Route)
The v2 reference has a Customer Detail view with full order history, lifetime chart, notes editor. The refactored app uses a slide-out drawer with limited info and stubs.

### 3.4 No Product Detail Page
The v2 reference has a Product Detail page with edit form, variant management, stock history, and sales performance. The refactored app has no equivalent.

### 3.5 No Notifications Page
Hardcoded dropdown in Topbar with no dedicated `/notifications` route.

### 3.6 No User/Profile Page
No `/profile` or `/account` dedicated route for user management.

---

## 4. UI / UX LAYOUT ISSUES

### 4.1 Inbox — Missing Right Context Panel (Major UX Gap)
The `SyncSales_v2.jsx` has a 3-panel inbox (conversation list | chat area | customer context panel). The refactored version omits the context panel entirely. This panel showed:
- Customer details (name, tier, platform, address)
- Quick order-from-chat button
- Quick product catalog
- Conversation history summary  
This is a **core sales workflow feature** — without it, users must leave inbox to look up customer/order context.

### 4.2 Inbox — No Filter by Status (Active / Pending / Resolved)
`SyncSales_v2.jsx` has filter tabs: `All | Active | AI Handled | Pending | Resolved`. The refactored inbox has only a free-text search. High-volume sellers cannot triage conversations.

### 4.3 Inbox — No "AI ON/OFF" Toggle Per Conversation
`SyncSales_v2.jsx` has a per-conversation "AI Handling" toggle that lets the seller take over. Missing entirely from the refactored version.

### 4.4 Inventory — No Product Card Grid View
`SyncSales_v2.jsx` has a toggle between **Table View** and **Card Grid View** for inventory. Refactored version is table-only.

### 4.5 Inventory — No Bulk Stock Update Modal
`SyncSales_v2.jsx` has a "Bulk Restock" modal where multiple products and quantities can be entered at once. Refactored version has only single-item delete.

### 4.6 Orders — No Sort by Column
The Orders table has no sortable column headers. `SyncSales_v2.jsx` implements full sort by any column (date, total, status, platform).

### 4.7 Orders — No Date Range Filter
`SyncSales_v2.jsx` has "Today / This Week / This Month" quick filters on orders. Missing from refactored version.

### 4.8 Analytics — Missing Conversion Funnel Chart
`SyncSales_v2.jsx` shows a conversion funnel (`Messages → Leads → Cart → Order → Delivered`). `AnalyticsPage.tsx` has no funnel visualization — just 3 charts.

### 4.9 Analytics — Missing Response Time Chart
`SyncSales_v2.jsx` shows "AI vs. Human Response Time" comparison chart. Missing from refactored `AnalyticsPage.tsx`.

### 4.10 Analytics — Missing Weekly Orders Bar Chart
`SyncSales_v2.jsx` has a "Weekly Orders by Day" bar chart. Missing from refactored `AnalyticsPage.tsx`.

### 4.11 Dashboard — No Activity Feed
`SyncSales_v2.jsx` has a real-time activity feed (new orders, stock alerts, payments, messages). The refactored `DashboardPage.tsx` has no activity feed.

### 4.12 Dashboard — Revenue Chart Missing Expenses Line
`DashboardPage.tsx` draws revenue + profit lines but NOT expenses. `SyncSales_v2.jsx` overlays all 3 for a complete P&L overview.

### 4.13 Accounting — No Add Transaction Button / Form
`SyncSales_v2.jsx` has an "Add Transaction" button with a form to log manual expenses. `AccountingPage.tsx` has only an Export button and no create flow.

### 4.14 Accounting — No Monthly P&L Trend Chart
`SyncSales_v2.jsx` shows a 6-month P&L bar chart in accounting. The refactored `AccountingPage.tsx` only shows cash flow and expense breakdown charts — missing the monthly comparison.

### 4.15 Automation — New Automation Form is a Stub
Clicking "New Automation" shows a toast: "coming soon". `SyncSales_v2.jsx` has no automation creation form either, but the product roadmap (pitch deck) expects this to be a core feature.

### 4.16 Settings — No Profile Photo Upload
`SyncSales_v2.jsx` has an avatar/photo upload in profile settings. Missing.

### 4.17 Settings — No Plan/Subscription Section
Users have a `plan` field ("starter" | "pro" | "enterprise") in the auth store but there is no Settings tab showing current plan, usage limits, or upgrade CTA.

### 4.18 Sidebar — No "AI Assistant" Quick Launch Button
`SyncSales_v2.jsx` has a prominent "Ask AI" button in the sidebar. The refactored sidebar has no such shortcut — the only way to open AI is via the Topbar "AI" button, which is small and easy to miss.

### 4.19 AppShell — Sidebar Collapse Toggle is Absolutely Positioned and Clips
**File:** `src/app/layout/Sidebar.tsx` line 128  
```tsx
className="absolute -right-3 top-16 w-6 h-6 ... z-10"`
```
The toggle button is `position: absolute; right: -12px` which puts it outside the sidebar boundary. On smaller screens or when content overflows, this button can be hidden behind page content.

### 4.20 Customer Drawer — Lifetime Value Progress Bar Hard-Coded to NPR 50,000 Max
**File:** `src/features/customers/CustomersPage.tsx` line 166:
```tsx
animate={{ width: `${Math.min((customer.totalSpent / 50000) * 100, 100)}%` }}
```
Sunita KC has `totalSpent: 48200` — nearly maxes out. Platinum customers who spent > 50,000 always show 100%. The scale is hardcoded and not tier-aware.

---

## 5. DATA & STATE ISSUES

### 5.1 No Data Persistence Across Page Reloads
All data is in-memory `mockData.ts` arrays. Creating an order, adding a customer, or deleting a product works in the session but **resets on refresh**. There is no localStorage, IndexedDB, or server persistence. This is acceptable for a demo but needs a clear "reset" or "seed" strategy.

### 5.2 Revenue Daily/Weekly Data is Non-Deterministic
```ts
export const revenueDaily = Array.from({ length: 30 }, (_, i) => ({
  revenue: Math.floor(Math.random() * 30000) + 10000, // regenerated on module load
}));
```
`Math.random()` is called at module load time — each tab/refresh gets completely different revenue charts. Should use a seeded pseudo-random or fixed dataset.

### 5.3 Sidebar Badges Never Update from Real Data
Sidebar shows static `badge: 7` for inbox and `badge: 3` for orders. These should read from:
- Inbox: `conversations.filter(c => c.unread > 0).length`
- Orders: `orders.filter(o => o.status === "pending").length`

### 5.4 Dashboard Stats are Fully Static Mock
`mockDashboardStats` is a hardcoded object. `todayRevenue: 18420` is always 18,420 regardless of what orders exist. The dashboard should compute stats from the live `mockOrders` array.

### 5.5 Conversation Messages Only Exist for IDs 1 and 4
```ts
export const mockMessages: Record<number, Message[]> = {
  1: [...],  // Priya Sharma
  4: [...],  // Bikram Rai
};
```
Clicking conversations 2, 3, 5, 6, 7 shows an empty chat area — no messages, no placeholder. The API returns `[]` which renders a blank screen with no empty state message for the chat area.

### 5.6 Order "customerId: null" Causes Broken "View Profile" Link
Orders like `#1845` (Anil Maharjan), `#1843` (Binita Rana) etc. have `customerId: null`. The "View customer profile" button on `OrderDetailPage.tsx` is conditionally hidden `{order.customerId && ...}` — fine — but the `handleContactCustomer` function generates a fake email fallback (`mailto:name@gmail.com`) which is incorrect.

### 5.7 mockData Does Not Match Types — Missing `createdAt`/`updatedAt` in Some Entries
The `Product` type requires `createdAt: string` and `updatedAt: string`, and `mockProducts` includes them. However the `api/index.ts` `create` function generates them correctly for new products. But legacy data created via the `v2.jsx` DB format wouldn't have them.

---

## 6. MISSING FROM SYNCSALES_V2.JSX REFERENCE

The following complete UI sections/behaviors exist in `SyncSales_v2.jsx` but are **absent** from the refactored app:

| # | V2 Feature | Current Status |
|---|-----------|---------------|
| 1 | **Inbox Context Panel** (3rd column with customer info + quick order) | ❌ Missing |
| 2 | **Inbox AI Toggle per conversation** (handoff to human) | ❌ Missing |
| 3 | **Inbox Conversation Status Filter** (All/Active/Pending/Resolved) | ❌ Missing |
| 4 | **Inventory Grid View** (card layout) | ❌ Missing |
| 5 | **Inventory Bulk Restock Modal** | ❌ Missing |
| 6 | **Product Add/Edit Modal** (full form with image/emoji, variants, price, cost) | ❌ Missing |
| 7 | **Product Detail Subpage** (sales, stock chart) | ❌ Missing |
| 8 | **Orders Date Range Quick Filter** | ❌ Missing |
| 9 | **Orders Column Sort** | ❌ Missing |
| 10 | **Customer Detail Subpage** (full page, not just drawer) | ❌ Partial (drawer only, stubs) |
| 11 | **Analytics Conversion Funnel** | ❌ Missing |
| 12 | **Analytics Response Time Chart** | ❌ Missing |
| 13 | **Analytics Weekly Orders Chart** | ❌ Missing |
| 14 | **Dashboard Activity Feed** | ❌ Missing |
| 15 | **Accounting Add Transaction** | ❌ Missing |
| 16 | **Accounting Monthly P&L Trend** | ❌ Missing |
| 17 | **Health Score / Business Insight Cards** | ❌ Missing |
| 18 | **Sidebar AI Quick-Launch Button** | ❌ Missing |
| 19 | **Settings Profile Photo Upload** | ❌ Missing |
| 20 | **Settings Plan & Subscription Tab** | ❌ Missing |

---

## 7. MISSING PRODUCT FEATURES FROM PITCH DECK

Based on the `SyncSales_Pitch_Deck.docx` (SyncSales value propositions for Tier-1 Nepali fashion sellers):

### 7.1 AI-Powered Order Creation from Chat
The pitch deck highlights automatic order creation directly from WhatsApp/Instagram conversations. The inbox "quick order" button that creates an order pre-filled with the conversation's customer data is **absent** from the refactored app (exists in `v2.jsx` context panel).

### 7.2 Platform-wise Revenue Attribution  
The pitch promises sellers can see which platform (WhatsApp, Instagram, Facebook) drives the most revenue. The Analytics pie chart exists but lacks:
- Trend over time per platform
- Platform ROI comparison (revenue vs. ad spend per platform)

### 7.3 WhatsApp Broadcast / Bulk Messaging  
No UI for sending a message to multiple customers (e.g., new collection announcement). This is mentioned as a key automation feature in the pitch deck.

### 7.4 Multi-Staff / Role Management  
The `User` type has `role: "owner" | "manager" | "staff" | "viewer"` but:
- No invite staff member flow
- No role-based UI gating (all users see everything)
- No Staff Management page

### 7.5 Delivery Partner Integration UI  
Pathao / Daraz integration is listed as an integration card but has no actual setup flow, tracking number paste, or delivery initiation UI.

### 7.6 Customer Loyalty / Tier Upgrade Logic  
The tier system (Bronze/Silver/Gold/Platinum) is display-only. There is no automatic tier upgrade logic, no notification when a customer upgrades, and no manual override.

### 7.7 NPR Currency Formatting on Mobile  
Mobile devices may not render `NPR` + `toLocaleString()` correctly without locale specification. `formatCurrency` in `lib/utils.ts` should explicitly use `{ locale: 'en-NP' }` or format manually.

---

## 8. COMPONENT-LEVEL ISSUES

### 8.1 `Topbar.tsx` — Page Label Matching is Fragile
```tsx
const pageLabel = Object.entries(PAGE_LABELS).find(([key]) =>
  key === "/" ? location.pathname === "/" : location.pathname.startsWith(key)
)?.[1] ?? "Page";
```
`/analytics` will match before `/analytics/revenue` because `startsWith` is used in a non-priority order. The Topbar will show "Analytics" for both `/analytics` and `/analytics/revenue`. Should sort by length descending or use exact match.

### 8.2 `RevenuePage.tsx` — Export CSV Button Has No Handler
```tsx
<Button variant="outline" size="sm" icon={<Download size={13} />}>
  Export CSV  // ← no onClick prop
</Button>
```

### 8.3 `AccountingPage.tsx` — Export Button Has No Handler
Same issue as above — renders but does nothing.

### 8.4 `AIPanel.tsx` — "Help me with..." Suggestion Sends Incomplete Query
```ts
const SUGGESTIONS = [ ..., "Help me with...", ];
```
If a user clicks "Help me with..." it sends that exact partial text as a query, which falls through to the default AI response. Should open a text field or be removed.

### 8.5 `AIPanel.tsx` — No Scroll-to-Bottom on Open
When the AI panel opens, the welcome message is at top. If the user had prior messages, the panel doesn't scroll to bottom on initial open — only on new messages (`useEffect` only fires when `messages` changes, not on `aiPanelOpen` change).

### 8.6 `ConfirmDialog` — Missing from `AppShell.tsx`
The `useConfirmDialog` store exists in `src/store/index.ts` and is used in `OrdersPage`, `OrderDetailPage`, `InventoryPage`. But no confirm dialog component is rendered in the app shell (`AppShell.tsx`). There is a `src/components/dialogs/` directory — check if it has the dialog component and if it's mounted.

```bash
# Check if ConfirmDialog is actually mounted:
grep -r "ConfirmDialog\|useConfirmDialog" src/app/
# grep -r "ConfirmDialog" src/components/dialogs/
```

### 8.7 `useSelectedRows` Hook — `toggleAll` Behavior
**File:** `src/features/inventory/InventoryPage.tsx` line 74  
```tsx
const allSelected = products.length > 0 && products.every(p => selected.has(p.id));
```
`selected.has(p.id)` uses the product `id` (number) but the generic `useSelectedRows<Product>` uses `Set<unknown>`. Need to verify type matching is correct and the `Set` properly handles numeric IDs.

### 8.8 `CreateOrderDialog` — "Platform" is a Free-text Input with No Validation
```tsx
<Input label="Platform" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} list="platforms" />
```
User can type anything but it's cast to `Platform` type. Should be a `<Select>` with fixed options.

### 8.9 `CreateOrderDialog` — Only Supports Single Item
The form allows only 1 item per order. Real orders often have multiple items. `SyncSales_v2.jsx` supports multi-item orders. The `Order` type supports `items: OrderItem[]` arrays already.

### 8.10 `AppShell.tsx` — Sidebar Doesn't Close on Mobile After Navigation
On mobile, collapsing the sidebar sets `sidebarCollapsed: true` but clicking a nav link doesn't auto-close the sidebar. The sidebar toggle on mobile (hamburger) manually calls `toggleSidebar()` — but navigation via `NavLink` does not.

---

## 9. PERFORMANCE & CODE QUALITY ISSUES

### 9.1 `mockData.ts` — `Math.random()` At Module Top Level
```ts
export const revenueDaily = Array.from({ length: 30 }, (_, i) => ({
  revenue: Math.floor(Math.random() * 30000) + 10000,
}));
```
Called at module evaluation time. Every refresh generates new random data — charts flicker and are non-reproducible for testing.

### 9.2 API Layer Re-mutates Shared Arrays (Memory Mutation Bug)
```ts
// api/index.ts line 71
mockProducts.push(newProduct);
// api/index.ts line 86
mockProducts.splice(index, 1);
// api/index.ts line 112
mockOrders[index] = { ...mockOrders[index], status };
```
Directly mutating exported arrays from `mockData.ts`. React Query caches old data — mutations may not invalidate because the reference identity of the sorted/sliced result didn't change. Should use `queryClient.invalidateQueries()` AND avoid direct array mutation (use immutable patterns).

### 9.3 No Error Boundaries
If any page component throws (e.g., `PLATFORM_CONFIG[undefined]` access), the entire app crashes to a blank screen. No `<ErrorBoundary>` wraps any route.

### 9.4 `PLATFORM_CONFIG[conv.platform]` Can Throw If Platform is Undefined
**Files:** `DashboardPage.tsx:229`, `InboxPage.tsx:87`, multiple others  
```tsx
const platformCfg = PLATFORM_CONFIG[order.platform]; // could be undefined
// Then used unchecked:
<Badge color={platformCfg.color} ...  // TypeError if platformCfg is undefined
```
If a conversation or order has an unknown `platform` value, this crashes the entire component.

### 9.5 No Loading State on AI Panel Open
When the AI panel animation completes, there's no skeleton/loading state for the initial assistant message — it just appears. Minor UX improvement but noticeable on slow machines.

### 9.6 `InboxPage.tsx` — Chat Messages Container Fixed Height May Clip on Small Screens
```tsx
<div className="flex h-[calc(100vh-120px)] gap-4 max-w-[1400px]">
```
`100vh - 120px` assumes the topbar is exactly 56px + content padding 64px. On mobile or with different zoom levels this clips content.

### 9.7 No Rate Limiting / Debounce on AI Panel Send
Users can spam the "Send" button rapidly. There's a `disabled` state on the button while typing is true, but `isTyping` is set with `setTimeout(600)` — so rapid Enter key presses can submit multiple identical queries.

### 9.8 `tailwind.config.js` — Primary Color Mismatch
Tailwind config defines `primary-600: "#006D5B"` but the `src/styles/globals.css` may define additional CSS variables. The `SyncSales_v2.jsx` uses CSS variables `--primary: #006D5B`. Ensure no duplication or conflict between Tailwind token and CSS variable.

### 9.9 Sidebar Toggle Button Has z-index Collision Risk
```tsx
className="absolute -right-3 top-16 ... z-10"
```
`z-10` may be overridden by page content with higher z-index (modals use `z-40`, `z-50`). The toggle could visually disappear behind open dropdowns.

---

## 10. MOBILE / RESPONSIVE ISSUES

### 10.1 Inbox Page — Not Usable on Mobile
```tsx
<div className="flex h-[calc(100vh-120px)] gap-4 max-w-[1400px]">
  <div className="w-72 shrink-0 ...">  {/* 288px wide - doesn't collapse on mobile */}
```
On screens < 768px, the 288px conversation list and chat panel overflow horizontally. No mobile layout (stack vertically, show one panel at a time).

### 10.2 Orders Table — Truncates on Mobile
The orders table has 9 columns. On mobile (< 640px), horizontal scroll is the only option but `overflow-x-auto` is applied at the card level. Column visibility management (hide non-essential columns on mobile) is absent.

### 10.3 Dashboard Charts — May Overflow on Narrow Screens  
`ResponsiveContainer width="100%"` respects parent width, but the parent grid `grid-cols-1 lg:grid-cols-3` shifts to 1-column on mobile. The chart heights are fixed pixel values which may look oversized on small phones.

### 10.4 Settings Page — No Mobile Layout
```tsx
<div className="flex gap-5 max-w-[900px]">
  <div className="w-44 shrink-0">  {/* sidebar takes 176px, no mobile stack */}
```
On mobile, Settings renders a narrow left nav + cramped content — should stack vertically on `sm:` breakpoint.

### 10.5 Customer Detail Drawer — Takes Full Width on Mobile But Missing Close Gesture
The drawer uses `max-w-md` (448px) — on mobile this snaps to full screen but there's no swipe-to-close gesture. Only the overlay backdrop click and X button close it.

### 10.6 Topbar — Search Hidden on Small Screens
```tsx
<div className="relative hidden sm:flex items-center">
```
Search is `hidden` below `sm:` breakpoint with no alternative (no search icon button that expands). Users on mobile cannot use global search at all.

---

## 11. PRIORITY FIX LIST

### 🔴 P0 — Critical (Production Blockers)
1. **Inbox "Mark Resolved" / "View Profile" — add onClick handlers**
2. **Inbox — render empty state for conversations with no messages** (IDs 2, 3, 5, 6, 7)
3. **Inventory — wire `categoryFilter` to API call**
4. **Inventory — add Product Add/Edit modal** (currently no create path)
5. **CreateCustomerDialog — replace `window.location.reload()` with query invalidation**
6. **OrdersPage — fix `todayRevenue` to filter by today's date only**
7. **Add Error Boundaries** around all route pages
8. **Sidebar badges — compute dynamically from query data**
9. **PLATFORM_CONFIG undefined access — add nullish checks everywhere**

### 🟠 P1 — High Priority (Core UX Gaps)
10. **Inbox — Add 3rd column context panel** (customer info + quick order)
11. **Inbox — Add conversation status filter tabs** (Active/Pending/Resolved)
12. **Inbox — Add per-conversation AI handoff toggle**
13. **Orders — Add column sort**
14. **Orders — Add date range filter**
15. **Analytics — Add conversion funnel chart**
16. **Dashboard — Add activity feed widget**
17. **Accounting — Add "Add Transaction" form**
18. **Settings — Make all forms controlled with proper save logic**
19. **Global Search in Topbar — implement or remove**
20. **Fix Revenue daily/weekly data — use deterministic seed or fixed mock**

### 🟡 P2 — Medium Priority (Feature Completeness)
21. **Customer — Replace drawer with full Customer Detail page**
22. **Inventory — Add Grid/List view toggle**
23. **Inventory — Add Bulk Restock modal**
24. **Orders — Add "Export CSV" handler to AccountingPage and RevenuePage**
25. **Notifications — Make dismissible with real data**
26. **Settings — Add Plan & Subscription tab**
27. **Topbar pageLabel — fix `startsWith` priority bug**
28. **CreateOrderDialog — support multiple line items**
29. **CreateOrderDialog — use `<Select>` for Platform field**
30. **AI Panel — scroll-to-bottom on panel open**

### 🟢 P3 — Nice to Have (Polish)
31. **Add 404 page** with illustration and back navigation
32. **Add Login page** with auth guard
33. **Sidebar — auto-collapse on mobile after nav link click**
34. **Customer Tier progress bar — dynamic max based on tier**
35. **Accounting monthly P&L trend chart**
36. **Report printing — print-specific CSS media queries**
37. **WhatsApp Broadcast feature page**
38. **Staff Management page**
39. **Product Detail page with sales history**
40. **Revenue Page Export CSV handler**

---

## File Map Quick Reference

```
src/
├── app/
│   ├── App.tsx                      ✅ Thin root
│   ├── providers.tsx                ✅ QueryClient + router
│   ├── router.tsx                   ✅ All routes defined
│   └── layout/
│       ├── AppShell.tsx             ⚠️ Confirm dialog not mounted
│       ├── Sidebar.tsx              ⚠️ Hardcoded badges
│       ├── Topbar.tsx               ⚠️ Non-functional search + static notifs
│       └── AIPanel.tsx              ✅ Working basic AI
├── features/
│   ├── dashboard/DashboardPage.tsx  ⚠️ Missing activity feed
│   ├── inbox/InboxPage.tsx          🔴 Missing context panel, dead buttons
│   ├── orders/
│   │   ├── OrdersPage.tsx           ⚠️ Wrong revenue, no sort/date filter
│   │   ├── OrderDetailPage.tsx      ⚠️ Wrong customer link, txt not PDF invoice
│   │   ├── CreateOrderDialog.tsx    ⚠️ Single item only, free-text platform
│   ├── inventory/InventoryPage.tsx  🔴 No add/edit, category filter broken
│   ├── customers/
│   │   ├── CustomersPage.tsx        🔴 Reload bug, stubs, no filter
│   │   ├── CreateCustomerDialog.tsx ✅ Works
│   ├── analytics/
│   │   ├── AnalyticsPage.tsx        ⚠️ Missing funnel + response time charts
│   │   └── RevenuePage.tsx          ⚠️ Random data, no CSV export
│   ├── accounting/AccountingPage.tsx ⚠️ No add transaction, no export
│   ├── automation/AutomationPage.tsx ⚠️ New automation stub
│   ├── integrations/IntegrationsPage.tsx ⚠️ No persistence
│   └── settings/SettingsPage.tsx    🔴 All uncontrolled, no real save
├── api/index.ts                     ⚠️ Mutates shared arrays directly
├── store/index.ts                   ✅ Zustand stores well-structured
├── lib/
│   ├── mockData.ts                  ⚠️ Math.random in module scope
│   └── utils.ts                    ✅ Good utilities
├── types/index.ts                   ✅ Well-typed
└── components/
    ├── ui/                          ✅ Good component library
    ├── feedback/                    ✅ Toast, skeleton, empty state
    └── dialogs/                     ⚠️ ConfirmDialog exists? Check if mounted
```

---

*End of Audit — Total Issues Found: 80+*
