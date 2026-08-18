import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, Brain, CreditCard, ScrollText, LogOut, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminToken } from "@/api/client";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/businesses", label: "Businesses", icon: Building2 },
  { to: "/ai-analytics", label: "AI Analytics", icon: Brain },
  { to: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/logs", label: "Logs", icon: ScrollText },
];

export function AdminShell() {
  const navigate = useNavigate();

  function logout() {
    adminToken.clear();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 bg-admin-surface border-r border-admin-border flex flex-col">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-admin-border">
          <Shield className="w-5 h-5 text-admin-accent" />
          <span className="font-bold text-white">SyncSales Admin</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive ? "bg-admin-accent/15 text-admin-accent" : "text-admin-muted hover:text-white hover:bg-white/5"
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={logout}
          className="flex items-center gap-2 m-3 px-3 py-2.5 rounded-lg text-sm text-admin-muted hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
