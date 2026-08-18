import type { ReactNode } from "react";
import { useAuth } from "./useAuth";
import type { Permission } from "./auth.types";

interface PermissionGateProps {
  permission?: Permission;
  permissions?: Permission[]; // require ALL of these
  anyOf?: Permission[];       // require ANY of these
  children: ReactNode;
  fallback?: ReactNode;       // shown when no permission
}

/**
 * PermissionGate — conditionally renders children based on RBAC permissions.
 *
 * Usage:
 *   <PermissionGate permission="inventory.write">
 *     <EditButton />
 *   </PermissionGate>
 *
 *   <PermissionGate anyOf={["orders.manage", "orders.read"]} fallback={<p>No access</p>}>
 *     <OrdersSection />
 *   </PermissionGate>
 */
export function PermissionGate({
  permission,
  permissions,
  anyOf,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { session, hasPermission, hasAnyPermission } = useAuth();

  if (!session) return <>{fallback}</>;

  // Owner always passes
  if (session.user.type === "owner") return <>{children}</>;

  // Single permission check
  if (permission && !hasPermission(permission)) return <>{fallback}</>;

  // All must pass
  if (permissions && !permissions.every((p) => hasPermission(p))) return <>{fallback}</>;

  // At least one must pass
  if (anyOf && !hasAnyPermission(anyOf)) return <>{fallback}</>;

  return <>{children}</>;
}
