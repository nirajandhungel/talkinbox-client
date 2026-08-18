import { create } from "zustand";
import type { Toast, ToastVariant } from "@/types";
import { generateId } from "@/lib/utils";

// ─── Toast Store ──────────────────────────────────────────────────

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, variant = "info", duration = 3500) => {
    const id = generateId();
    set((state) => ({ toasts: [...state.toasts, { id, message, variant, duration }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

// ─── UI Store ─────────────────────────────────────────────────────

interface UIStore {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  aiPanelOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (value: boolean) => void;
  toggleAiPanel: () => void;
  setSidebarCollapsed: (value: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  aiPanelOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleMobileSidebar: () => set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
  setMobileSidebarOpen: (value) => set({ mobileSidebarOpen: value }),
  toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
}));

// ─── Auth Store (bridge → AuthProvider) ──────────────────────────────────────
//
// Legacy components (Sidebar, Topbar) use useAuthStore().
// This store is synced FROM AuthProvider via the syncAuthStore() helper.
// New code should use useAuth() directly from @/auth/useAuth.

interface AuthStore {
  user: {
    id: string;
    name: string;
    email: string;
    role: "owner" | "manager" | "staff" | "viewer";
    businessName: string;
    plan: "starter" | "pro" | "enterprise";
  } | null;
  isAuthenticated: boolean;
  login: (user: AuthStore["user"]) => void;
  logout: () => void;
  // Internal: called by AuthProvider to keep in sync
  _sync: (user: AuthStore["user"], isAuthenticated: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
  _sync: (user, isAuthenticated) => set({ user, isAuthenticated }),
}));

// ─── Confirm Dialog Store ─────────────────────────────────────────

interface ConfirmDialogStore {
  open: boolean;
  title: string;
  description: string;
  onConfirm: (() => void) | null;
  variant: "danger" | "warning" | "default";
  confirm: (options: {
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "default";
  }) => void;
  close: () => void;
}

export const useConfirmDialog = create<ConfirmDialogStore>((set) => ({
  open: false,
  title: "",
  description: "",
  onConfirm: null,
  variant: "default",
  confirm: ({ title, description, onConfirm, variant = "default" }) =>
    set({ open: true, title, description, onConfirm, variant }),
  close: () => set({ open: false, onConfirm: null }),
}));
