import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./useAuth";
import type { Permission } from "./auth.types";
import { AccessDeniedPage } from "@/pages/auth/AccessDeniedPage";

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: Permission;
  anyOf?: Permission[];
}

/**
 * ProtectedRoute — guards a route behind authentication + optional permission.
 *
 * If not authenticated → redirects to /login (preserves intended location).
 * If authenticated but missing permission → renders AccessDeniedPage.
 *
 * Usage:
 *   <ProtectedRoute permission="accounting.view">
 *     <AccountingPage />
 *   </ProtectedRoute>
 */
export function ProtectedRoute({ children, permission, anyOf }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, session, hasPermission, hasAnyPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-elevated">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-foreground-muted">Verifying session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Owner bypasses all permission guards
  const isOwner = session?.user.type === "owner";

  if (!isOwner) {
    if (permission && !hasPermission(permission)) return <AccessDeniedPage />;
    if (anyOf && !hasAnyPermission(anyOf)) return <AccessDeniedPage />;
  }

  return <>{children}</>;
}
