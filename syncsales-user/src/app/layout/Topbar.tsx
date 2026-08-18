import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Search, Bot, Menu, LogOut, Settings, User, ChevronDown, ShieldCheck } from "lucide-react";
import { useUIStore } from "@/store";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
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
    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-slate-100 shadow-card-lg z-50 overflow-hidden">
      {/* Profile header */}
      <div className="px-4 py-4 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Avatar initials={initials} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider",
                isOwner
                  ? "bg-primary-100 text-primary-700"
                  : "bg-slate-100 text-slate-600"
              )}>
                {isOwner ? "Owner" : "Staff"}
              </span>
              <span className="text-[9px] text-slate-400 truncate">{tenant?.businessName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="py-1.5">
        <button
          onClick={() => go("/settings")}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Settings size={14} className="text-slate-400" />
          Account Settings
        </button>

        {isOwner && (
          <>
            <button
              onClick={() => go("/settings/staff")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <User size={14} className="text-slate-400" />
              Manage Staff
            </button>
            <button
              onClick={() => go("/settings/roles")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ShieldCheck size={14} className="text-slate-400" />
              Roles & Permissions
            </button>
          </>
        )}
      </div>

      {/* Divider + Logout */}
      <div className="border-t border-slate-100 py-1.5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors font-medium"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>

      {/* Plan badge */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
        <p className="text-[10px] text-slate-400">
          <span className={cn(
            "font-bold mr-1 uppercase",
            tenant?.plan === "pro" ? "text-primary-600" : "text-slate-500"
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
  const { toggleMobileSidebar, toggleAiPanel } = useUIStore();
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
    <header className="h-12 sm:h-14 flex items-center px-3 sm:px-4 gap-2 sm:gap-3 bg-white border-b border-slate-100 shrink-0">
      {/* Hamburger — mobile only */}
      <button
        onClick={toggleMobileSidebar}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors md:hidden"
      >
        <Menu size={18} />
      </button>

      <h1 className="text-sm font-semibold text-slate-800 mr-auto truncate">{pageLabel}</h1>

      {/* Search */}
      <div className="relative hidden sm:flex items-center">
        <Search size={13} className="absolute left-3 text-slate-400 pointer-events-none" />
        <input
          placeholder="Search..."
          className={cn(
            "pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
            "w-48 transition-all focus:w-64"
          )}
        />
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
          className="relative p-1.5 sm:p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Bell size={16} />
          <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>

        {notifOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-xl border border-slate-100 shadow-card-lg z-40 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-800">Notifications</span>
                <span className="text-[10px] font-medium bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded-full">3 new</span>
              </div>
              {[
                { text: "New order #1847 from Priya Sharma", time: "2m ago", color: "bg-green-400" },
                { text: "Low stock alert: Blue Denim Jacket (3 left)", time: "15m ago", color: "bg-amber-400" },
                { text: "7 unread messages in inbox", time: "30m ago", color: "bg-blue-400" },
              ].map((n, i) => (
                <div key={i} className="px-4 py-3 border-b border-slate-50 flex gap-3 hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", n.color)} />
                  <div>
                    <p className="text-xs text-slate-700">{n.text}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* AI Panel toggle */}
      <Button variant="secondary" size="sm" icon={<Bot size={13} />} onClick={toggleAiPanel} className="hidden sm:inline-flex">
        AI
      </Button>
      <button
        onClick={toggleAiPanel}
        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors sm:hidden"
      >
        <Bot size={16} />
      </button>

      {/* Profile avatar + dropdown */}
      {user && (
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className={cn(
              "flex items-center gap-1.5 rounded-lg p-1 transition-colors",
              profileOpen ? "bg-slate-100" : "hover:bg-slate-50"
            )}
            aria-label="Open profile menu"
            title="Profile & Sign Out"
          >
            <Avatar initials={initials} size="sm" />
            <ChevronDown
              size={12}
              className={cn(
                "text-slate-400 transition-transform duration-200 hidden sm:block",
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
