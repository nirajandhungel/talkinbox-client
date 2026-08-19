import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "./layout/AppShell";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { SkeletonTable } from "@/components/feedback/Skeleton";
import { ProtectedRoute } from "@/auth/ProtectedRoute";

// ─── Lazy loaded pages ────────────────────────────────────────────────────────

const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage"));
const InboxPage = lazy(() => import("@/features/inbox/InboxPage"));
const OrdersPage = lazy(() => import("@/features/orders/OrdersPage"));
const OrderDetailPage = lazy(() => import("@/features/orders/OrderDetailPage"));
const InventoryPage = lazy(() => import("@/features/inventory/InventoryPage"));
const CustomersPage = lazy(() => import("@/features/customers/CustomersPage"));
const AnalyticsPage = lazy(() => import("@/features/analytics/AnalyticsPage"));
const RevenuePage = lazy(() => import("@/features/analytics/RevenuePage"));
const RevenueDetailPage = lazy(() => import("@/features/analytics/RevenueDetailPage"));
const AccountingPage = lazy(() => import("@/features/accounting/AccountingPage"));
const AutomationPage = lazy(() => import("@/features/automation/AutomationPage"));
const IntegrationsPage = lazy(() => import("@/features/integrations/IntegrationsPage"));
const ConnectIntegrationPage = lazy(() => import("@/features/integrations/ConnectIntegrationPage"));
const SettingsPage = lazy(() => import("@/features/settings/SettingsPage"));
const AIAssistantPage = lazy(() => import("@/features/ai-assistant/AIAssistantPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

// Auth pages
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const VerifyOtpPage = lazy(() => import("@/pages/auth/VerifyOtpPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const OnboardingPage = lazy(() => import("@/pages/onboarding/OnboardingPage"));
const InviteAcceptPage = lazy(() => import("@/pages/auth/InviteAcceptPage"));
const OwnerSetupPage = lazy(() => import("@/pages/auth/OwnerSetupPage"));

// Settings sub-pages
const StaffManagementPage = lazy(() => import("@/pages/settings/StaffManagementPage"));
const RolesPage = lazy(() => import("@/pages/settings/RolesPage"));

// ─── Loaders ──────────────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-surface rounded-xl border border-border p-5 h-24 skeleton" />
        ))}
      </div>
      <SkeletonTable rows={6} />
    </div>
  );
}

function AuthLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

function AuthSuspense({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<AuthLoader />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  // ── Auth routes (public) ────────────────────────────────────────────────────
  {
    path: "/login",
    element: <AuthSuspense><LoginPage /></AuthSuspense>,
  },
  {
    path: "/register",
    element: <AuthSuspense><RegisterPage /></AuthSuspense>,
  },
  {
    path: "/verify-email",
    element: <AuthSuspense><VerifyOtpPage /></AuthSuspense>,
  },
  {
    path: "/forgot-password",
    element: <AuthSuspense><ForgotPasswordPage /></AuthSuspense>,
  },
  {
    path: "/onboarding",
    element: <AuthSuspense><OnboardingPage /></AuthSuspense>,
  },
  {
    path: "/invite/:token",
    element: <AuthSuspense><InviteAcceptPage /></AuthSuspense>,
  },
  {
    path: "/invite/:token/setup",
    element: <AuthSuspense><OwnerSetupPage /></AuthSuspense>,
  },

  // ── Dashboard routes (protected) ────────────────────────────────────────────
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper>,
      },
      {
        path: "inbox",
        element: (
          <ProtectedRoute permission="inbox.manage">
            <SuspenseWrapper><InboxPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "ai",
        element: (
          <ProtectedRoute>
            <SuspenseWrapper><AIAssistantPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "orders",
        element: (
          <ProtectedRoute permission="orders.read">
            <SuspenseWrapper><OrdersPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "orders/:orderId",
        element: (
          <ProtectedRoute permission="orders.read">
            <SuspenseWrapper><OrderDetailPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "inventory",
        element: (
          <ProtectedRoute permission="inventory.read">
            <SuspenseWrapper><InventoryPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "customers",
        element: (
          <ProtectedRoute permission="customers.read">
            <SuspenseWrapper><CustomersPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "analytics",
        element: (
          <ProtectedRoute permission="analytics.view">
            <SuspenseWrapper><AnalyticsPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "analytics/revenue",
        element: (
          <ProtectedRoute permission="revenue.view">
            <SuspenseWrapper><RevenuePage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "analytics/revenue/detail",
        element: (
          <ProtectedRoute permission="revenue.view">
            <SuspenseWrapper><RevenueDetailPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "accounting",
        element: (
          <ProtectedRoute permission="accounting.view">
            <SuspenseWrapper><AccountingPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "automation",
        element: (
          <ProtectedRoute>
            <SuspenseWrapper><AutomationPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "integrations",
        element: (
          <ProtectedRoute>
            <SuspenseWrapper><IntegrationsPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "integrations/connect/:platform",
        element: (
          <ProtectedRoute>
            <SuspenseWrapper><ConnectIntegrationPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute permission="settings.manage">
            <SuspenseWrapper><SettingsPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "settings/staff",
        element: (
          <ProtectedRoute permission="staff.manage">
            <SuspenseWrapper><StaffManagementPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "settings/roles",
        element: (
          <ProtectedRoute permission="staff.manage">
            <SuspenseWrapper><RolesPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      { path: "*", element: <SuspenseWrapper><NotFoundPage /></SuspenseWrapper> },
    ],
  },

  // Fallback redirect
  { path: "*", element: <Navigate to="/" replace /> },
]);
