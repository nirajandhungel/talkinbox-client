import { NavLink, useLocation, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, MessageSquare, ShoppingCart, Package,
  Users, BarChart2, BookOpen, Zap, Plug, Settings,
  ChevronLeft, ChevronRight, Zap as BoltIcon, X, LogOut, UserCog, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/auth/useAuth";
import type { Permission } from "@/auth/auth.types";
import { useConfirmDialog } from "@/store";

// ─── Nav Item Definitions ─────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: number;
  warn?: boolean;
  permission?: Permission;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard",    icon: LayoutDashboard, path: "/",            permission: "dashboard.view" },
  { id: "inbox",     label: "Inbox",        icon: MessageSquare,   path: "/inbox",       permission: "inbox.manage" },
  { id: "orders",    label: "Orders",       icon: ShoppingCart,    path: "/orders",      permission: "orders.read" },
  { id: "inventory", label: "Inventory",    icon: Package,         path: "/inventory",   permission: "inventory.read" },
  { id: "customers", label: "Customers",    icon: Users,           path: "/customers",   permission: "customers.read" },
  { id: "analytics", label: "Analytics",   icon: BarChart2,       path: "/analytics",   permission: "analytics.view" },
  { id: "accounting",label: "Accounting",  icon: BookOpen,        path: "/accounting",  permission: "accounting.view" },
  { id: "automation",label: "Automation",  icon: Zap,             path: "/automation" },
  { id: "integrations", label: "Integrations", icon: Plug,        path: "/integrations" },
  { id: "settings",  label: "Settings",    icon: Settings,        path: "/settings",    permission: "settings.manage" },
];

// ─── SidebarContent ───────────────────────────────────────────────────────────

function SidebarContent() {
  const { sidebarCollapsed, setMobileSidebarOpen } = useUIStore();
  const { session, hasPermission, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const confirm = useConfirmDialog((s) => s.confirm);

  const isOwner = session?.user.type === "owner";

  // Filter nav items based on permissions
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.permission) return true; // no restriction
    if (isOwner) return true;           // owner sees all
    return hasPermission(item.permission);
  });

  function handleNavClick() {
    setMobileSidebarOpen(false);
  }

  function handleLogout() {
    confirm({
      title: "Sign Out",
      description: "Are you sure you want to sign out?",
      variant: "default",
      onConfirm: async () => {
        await logout();
        navigate("/login");
      },
    });
  }

  const user = session?.user;
  const tenant = session?.tenant;
  const userInitials = user?.name.split(" ").map((n) => n[0]).join("").slice(0, 2) ?? "?";

  return (
    <>
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-2.5 px-4 py-4 border-b border-slate-100",
        sidebarCollapsed && "justify-center px-2"
      )}>
        <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
          <BoltIcon size={14} className="text-white" />
        </div>
        {!sidebarCollapsed && (
          <span className="text-sm font-bold text-slate-800">
            Sync<span className="text-primary-600">Sales</span>
          </span>
        )}
        {/* Mobile close button */}
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="ml-auto p-1 rounded-lg text-slate-400 hover:text-slate-600 md:hidden"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto scrollbar-thin">
        <div className="px-2 space-y-0.5">
          {!sidebarCollapsed && (
            <p className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Platform
            </p>
          )}
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={handleNavClick}
                title={sidebarCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg transition-colors duration-150",
                  sidebarCollapsed ? "justify-center p-2.5" : "px-2.5 py-2",
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <Icon size={15} className="shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-xs font-medium">{item.label}</span>
                    {item.badge && (
                      <span className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                        item.warn
                          ? "bg-amber-100 text-amber-700"
                          : "bg-primary-100 text-primary-700"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Owner-only section */}
          {isOwner && !sidebarCollapsed && (
            <>
              <p className="px-2 py-1.5 mt-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Admin
              </p>
              <NavLink
                to="/settings/staff"
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg transition-colors duration-150 px-2.5 py-2",
                  location.pathname.startsWith("/settings/staff")
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <UserCog size={15} className="shrink-0" />
                <span className="flex-1 text-xs font-medium">Staff</span>
              </NavLink>
              <NavLink
                to="/settings/roles"
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg transition-colors duration-150 px-2.5 py-2",
                  location.pathname.startsWith("/settings/roles")
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <ShieldCheck size={15} className="shrink-0" />
                <span className="flex-1 text-xs font-medium">Roles</span>
              </NavLink>
            </>
          )}
        </div>
      </nav>

      {/* User footer */}
      {user && (
        <div className={cn(
          "border-t border-slate-100 p-3",
          sidebarCollapsed && "flex justify-center"
        )}>
          {sidebarCollapsed ? (
            <Avatar initials={userInitials} size="sm" />
          ) : (
            <div className="flex items-center gap-2.5">
              <Avatar initials={userInitials} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 truncate">
                  {isOwner ? "Owner" : "Staff"} · {tenant?.businessName}
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { sidebarCollapsed, mobileSidebarOpen, toggleSidebar, setMobileSidebarOpen } = useUIStore();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-white border-r border-slate-100 h-full transition-all duration-200 shrink-0",
          sidebarCollapsed ? "w-14" : "w-56"
        )}
      >
        <SidebarContent />

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-16 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:shadow-sm transition-all z-10"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white z-50 flex flex-col shadow-xl md:hidden animate-slide-right">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
