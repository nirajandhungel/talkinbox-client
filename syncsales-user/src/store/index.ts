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
  theme: "dark" | "light";
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (value: boolean) => void;
  toggleAiPanel: () => void;
  setSidebarCollapsed: (value: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: "dark" | "light") => void;
}

const THEME_KEY = "syncsales_theme";

export function applyTheme(theme: "dark" | "light") {
  localStorage.setItem(THEME_KEY, theme);
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  root.style.colorScheme = theme;
}

const getInitialTheme = (): "dark" | "light" => {
  if (typeof document === "undefined") return "dark";
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return "dark";
};

const initialTheme = getInitialTheme();
if (typeof document !== "undefined") applyTheme(initialTheme);

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  aiPanelOpen: false,
  theme: initialTheme,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleMobileSidebar: () => set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
  setMobileSidebarOpen: (value) => set({ mobileSidebarOpen: value }),
  toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => set((s) => {
    const newTheme = s.theme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
    return { theme: newTheme };
  }),
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
