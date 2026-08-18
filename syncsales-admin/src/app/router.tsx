import { createBrowserRouter, Navigate } from "react-router-dom";
import { AdminShell } from "./layout/AdminShell";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/features/dashboard/DashboardPage";
import BusinessesPage from "@/features/businesses/BusinessesPage";
import AiAnalyticsPage from "@/features/ai-analytics/AiAnalyticsPage";
import SubscriptionsPage from "@/features/subscriptions/SubscriptionsPage";
import LogsPage from "@/features/logs/LogsPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AdminShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "businesses", element: <BusinessesPage /> },
      { path: "ai-analytics", element: <AiAnalyticsPage /> },
      { path: "subscriptions", element: <SubscriptionsPage /> },
      { path: "logs", element: <LogsPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
