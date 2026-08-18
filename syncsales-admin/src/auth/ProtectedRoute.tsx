import { Navigate } from "react-router-dom";
import { adminToken } from "@/api/client";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!adminToken.get()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
