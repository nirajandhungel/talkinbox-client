import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Search, Menu, LogOut, Settings, User, ChevronDown, ShieldCheck } from "lucide-react";
import { useUIStore } from "@/store";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/auth/useAuth";
import { useConfirmDialog } from "@/store";
import { cn } from "@/lib/utils";

const PAGE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/inbox": "Inbox",
  "/orders": "Orders",
  "/inventory": "Inventory",
  "/customers": "Customers",
  "/analytics": "Analytics",
  "/accounting": "Accounting",
  "/automation": "Automation",
  "/integrations": "Integrations",
  "/settings": "Settings",
  "/settings/staff": "Staff Management",
  "/settings/roles": "Roles & Permissions",
};

// ─── Profile Dropdown ─────────────────────────────────────────────────────────

function ProfileDropdown({ onClose }: { onClose: () => void }) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirmDialog((s) => s.confirm);

  const user = session?.user;
  const tenant = session?.tenant;
  const initials = user?.name.split(" ").map((n) => n[0]).join("").slice(0, 2) ?? "?";
  const isOwner = user?.type === "owner";

  function handleLogout() {
    onClose();
    confirm({
      title: "Sign Out",
      description: "Are you sure you want to sign out of SyncSales?",
      variant: "default",
      onConfirm: async () => {
        await logout();
        navigate("/login", { replace: true });
      },
    });
  }

  function go(path: string) {
    navigate(path);
    onClose();
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-64 bg-surface rounded-xl border border-border shadow-card-lg z-50 overflow-hidden">
      {/* Profile header */}
      <div className="px-4 py-4 bg-surface-elevated border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar initials={initials} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-foreground-muted truncate">{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider",
                isOwner
                  ? "bg-primary/20 text-primary-hover"
                  : "bg-surface-elevated text-foreground-muted"
              )}>
                {isOwner ? "Owner" : "Staff"}
              </span>
              <span className="text-[9px] text-foreground-muted truncate">{tenant?.businessName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="py-1.5">
        <button
          onClick={() => go("/settings")}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-foreground hover:bg-surface-elevated transition-colors"
        >
          <Settings size={14} className="text-foreground-muted" />
          Account Settings
        </button>

        {isOwner && (
          <>
            <button
              onClick={() => go("/settings/staff")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-foreground hover:bg-surface-elevated transition-colors"
            >
              <User size={14} className="text-foreground-muted" />
              Manage Staff
            </button>
            <button
              onClick={() => go("/settings/roles")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-foreground hover:bg-surface-elevated transition-colors"
            >
              <ShieldCheck size={14} className="text-foreground-muted" />
              Roles & Permissions
            </button>
          </>
        )}
      </div>

      {/* Divider + Logout */}
      <div className="border-t border-border py-1.5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-error hover:bg-error/10 transition-colors font-medium"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>

      {/* Plan badge */}
      <div className="px-4 py-2.5 bg-surface-elevated border-t border-border">
        <p className="text-[10px] text-foreground-muted">
          <span className={cn(
            "font-bold mr-1 uppercase",
            tenant?.plan === "pro" ? "text-primary" : "text-foreground-muted"
          )}>
            {tenant?.plan}
          </span>
          plan · SyncSales v1.0
        </p>
      </div>
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

export function Topbar() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { toggleMobileSidebar } = useUIStore();
  const { session } = useAuth();
  const location = useLocation();

  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  const pageLabel =
    Object.entries(PAGE_LABELS)
      .sort((a, b) => b[0].length - a[0].length) // longest match first
      .find(([key]) =>
        key === "/" ? location.pathname === "/" : location.pathname.startsWith(key)
      )?.[1] ?? "Page";

  const user = session?.user;
  const initials = user?.name.split(" ").map((n) => n[0]).join("").slice(0, 2) ?? "?";

  return (
    <header className="h-12 sm:h-14 flex items-center px-3 sm:px-4 gap-2 sm:gap-3 bg-surface border-b border-border shrink-0">
      {/* Hamburger — mobile only */}
      <button
        onClick={toggleMobileSidebar}
        className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground-muted hover:bg-surface-elevated transition-colors md:hidden"
      >
        <Menu size={18} />
      </button>

      <h1 className="text-sm font-semibold text-foreground mr-auto truncate">{pageLabel}</h1>

      {/* Search */}
      <div className="relative hidden sm:flex items-center">
        <Search size={13} className="absolute left-3 text-foreground-muted pointer-events-none" />
        <input
          placeholder="Search..."
          className={cn(
            "pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-surface-elevated",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            "w-48 transition-all focus:w-64"
          )}
        />
      </div>

      <ThemeToggle />

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
          className="relative p-1.5 sm:p-2 rounded-lg text-foreground-muted hover:bg-surface-elevated transition-colors"
        >
          <Bell size={16} />
          <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-1.5 h-1.5 rounded-full bg-error" />
        </button>

        {notifOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-72 bg-surface rounded-xl border border-border shadow-card-lg z-40 overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex justify-between items-center">
                <span className="text-xs font-semibold text-foreground">Notifications</span>
                <span className="text-[10px] font-medium bg-primary/10 text-primary-hover px-1.5 py-0.5 rounded-full">3 new</span>
              </div>
              {[
                { text: "New order #1847 from Priya Sharma", time: "2m ago", color: "bg-success" },
                { text: "Low stock alert: Blue Denim Jacket (3 left)", time: "15m ago", color: "bg-warning" },
                { text: "7 unread messages in inbox", time: "30m ago", color: "bg-primary" },
              ].map((n, i) => (
                <div key={i} className="px-4 py-3 border-b border-border flex gap-3 hover:bg-surface-elevated cursor-pointer transition-colors">
                  <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", n.color)} />
                  <div>
                    <p className="text-xs text-foreground">{n.text}</p>
                    <p className="text-[10px] text-foreground-muted mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Profile avatar + dropdown */}
      {user && (
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className={cn(
              "flex items-center gap-1.5 rounded-lg p-1 transition-colors",
              profileOpen ? "bg-surface-elevated" : "hover:bg-surface-elevated"
            )}
            aria-label="Open profile menu"
            title="Profile & Sign Out"
          >
            <Avatar initials={initials} size="sm" />
            <ChevronDown
              size={12}
              className={cn(
                "text-foreground-muted transition-transform duration-200 hidden sm:block",
                profileOpen && "rotate-180"
              )}
            />
          </button>

          {profileOpen && (
            <ProfileDropdown onClose={() => setProfileOpen(false)} />
          )}
        </div>
      )}
    </header>
  );
}
