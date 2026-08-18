import { useContext } from "react";
import { AuthContext } from "./authContext";
import type { AuthContextValue } from "./auth.types";

/**
 * useAuth — access the auth context anywhere in the app.
 *
 * Usage:
 *   const { session, hasPermission, login, logout } = useAuth();
 */
export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used inside <AuthProvider>. Wrap your app root.");
    }
    return ctx;
}
