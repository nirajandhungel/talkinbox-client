import { Outlet } from "react-router-dom";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, MessageSquare, ShoppingCart, Package, BarChart2,
} from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ToastStack } from "@/components/feedback/Toast";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { NetworkStatusBanner } from "@/components/feedback/NetworkStatusBanner";
import { cn } from "@/lib/utils";

// Bottom nav items for mobile (most essential features)
const MOBILE_NAV = [
  { label: "Home", icon: LayoutDashboard, path: "/" },
  { label: "Orders", icon: ShoppingCart, path: "/orders" },
  { label: "Inventory", icon: Package, path: "/inventory" },
  { label: "Inbox", icon: MessageSquare, path: "/inbox" },
  { label: "Analytics", icon: BarChart2, path: "/analytics" },
] as const;

export function AppShell() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar — hidden on mobile, shown on md+ */}
      <div className="relative hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-5 pb-20 md:pb-5">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation — shown only on small screens */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-surface border-t border-border safe-area-bottom">
        <div className="flex items-stretch justify-around h-14">
          {MOBILE_NAV.map((item) => {
            const isActive = item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-foreground-muted"
                )}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Global UI */}
      <NetworkStatusBanner />
      <ToastStack />
      <ConfirmDialog />
    </div>
  );
}
