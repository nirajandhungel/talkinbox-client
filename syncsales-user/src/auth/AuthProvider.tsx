import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { useAuthStore } from "@/store";
import type {
  Session,
  Permission,
  InviteToken,
  Role,
  AuthUser,
  CreateOwnerPayload,
  CreateStaffPayload,
  CreateRolePayload,
  AuthContextValue,
} from "./auth.types";
import { authService } from "@/services/authService";

// ─── State ────────────────────────────────────────────────────────────────────

interface AuthState {
  session: Session | null;
  isLoading: boolean;
}

type AuthAction =
  | { type: "LOADING" }
  | { type: "SET_SESSION"; session: Session }
  | { type: "CLEAR_SESSION" };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOADING":
      return { ...state, isLoading: true };
    case "SET_SESSION":
      return { session: action.session, isLoading: false };
    case "CLEAR_SESSION":
      return { session: null, isLoading: false };
    default:
      return state;
  }
}

import { AuthContext } from "./authContext";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    session: null,
    isLoading: true,
  });

  // Restore session on mount
  useEffect(() => {
    const session = authService.getCurrentSession();
    if (session) {
      dispatch({ type: "SET_SESSION", session });
    } else {
      dispatch({ type: "CLEAR_SESSION" });
    }
  }, []);

  // Listen for token-refresh failures that force a logout
  const logoutRef = useRef<(() => Promise<void>) | null>(null);
  const logoutStable = useCallback(async (): Promise<void> => {
    await authService.logout();
    dispatch({ type: "CLEAR_SESSION" });
  }, []);
  logoutRef.current = logoutStable;

  useEffect(() => {
    const handleExpired = () => {
      // Async handler cannot be used directly on addEventListener; use ref
      void logoutRef.current?.();
    };
    window.addEventListener("ss:session-expired", handleExpired);
    return () => window.removeEventListener("ss:session-expired", handleExpired);
  }, []);

  // Sync legacy Zustand authStore so Sidebar/Topbar stay updated
  const syncLegacy = useAuthStore((s) => s._sync);
  useEffect(() => {
    if (state.session) {
      const { user, tenant } = state.session;
      syncLegacy(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.type === "owner" ? "owner" : "staff",
          businessName: tenant.businessName,
          plan: tenant.plan,
        },
        true
      );
    } else {
      syncLegacy(null, false);
    }
  }, [state.session, syncLegacy]);

  // ── Permission checks ──────────────────────────────────────────────────────

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!state.session) return false;
      return state.session.permissions.includes(permission);
    },
    [state.session]
  );

  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      if (!state.session) return false;
      return permissions.some((p) => state.session!.permissions.includes(p));
    },
    [state.session]
  );

  // ── Auth actions ───────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    dispatch({ type: "LOADING" });
    try {
      const session = await authService.login(email, password);
      dispatch({ type: "SET_SESSION", session });
    } catch (err) {
      // Reset loading state so the button isn't stuck disabled on error
      dispatch({ type: "CLEAR_SESSION" });
      throw err;
    }
  }, []);

  const register = useCallback(async (data: Omit<CreateOwnerPayload, "inviteToken">): Promise<void> => {
    dispatch({ type: "LOADING" });
    try {
      const session = await authService.register(data);
      dispatch({ type: "SET_SESSION", session });
    } catch (err) {
      dispatch({ type: "CLEAR_SESSION" });
      throw err;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await authService.logout();
    dispatch({ type: "CLEAR_SESSION" });
  }, []);

  const validateInvite = useCallback(
    (token: string): Promise<InviteToken> => authService.validateInvite(token),
    []
  );

  const createOwner = useCallback(async (data: CreateOwnerPayload): Promise<void> => {
    dispatch({ type: "LOADING" });
    const session = await authService.createOwner(data);
    dispatch({ type: "SET_SESSION", session });
  }, []);

  const createStaff = useCallback(
    async (data: CreateStaffPayload): Promise<void> => {
      if (!state.session) throw new Error("Not authenticated.");
      await authService.createStaff(state.session.tenant.id, data);
    },
    [state.session]
  );

  // ── Role management ────────────────────────────────────────────────────────

  const updateRolePermissions = useCallback(
    async (roleId: string, permissions: Permission[]): Promise<void> => {
      await authService.updateRolePermissions(roleId, permissions);
    },
    []
  );

  const createRole = useCallback(
    async (data: CreateRolePayload): Promise<Role> => {
      if (!state.session) throw new Error("Not authenticated.");
      return authService.createRole(state.session.tenant.id, data);
    },
    [state.session]
  );

  const deleteRole = useCallback(async (roleId: string): Promise<void> => {
    await authService.deleteRole(roleId);
  }, []);

  // ── Staff management ───────────────────────────────────────────────────────

  const deactivateStaff = useCallback(async (userId: string): Promise<void> => {
    await authService.setStaffActive(userId, false);
  }, []);

  const reactivateStaff = useCallback(async (userId: string): Promise<void> => {
    await authService.setStaffActive(userId, true);
  }, []);

  const assignRoleToStaff = useCallback(
    async (userId: string, roleId: string): Promise<void> => {
      await authService.assignRole(userId, roleId);
    },
    []
  );

  // ── Context value ──────────────────────────────────────────────────────────

  const value: AuthContextValue = useMemo(
    () => ({
      session: state.session,
      isAuthenticated: !!state.session,
      isLoading: state.isLoading,
      login,
      register,
      logout,
      validateInvite,
      createOwner,
      createStaff,
      updateRolePermissions,
      createRole,
      deleteRole,
      deactivateStaff,
      reactivateStaff,
      assignRoleToStaff,
      hasPermission,
      hasAnyPermission,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.session, state.isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Re-export AuthUser for convenience
export type { AuthUser };
