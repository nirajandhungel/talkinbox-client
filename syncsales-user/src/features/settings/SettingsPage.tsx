import { useState } from "react";
import { Save, Store, Bell, Shield, Palette, Users, ShieldCheck } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ThemePicker } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/auth/useAuth";
import { useToast } from "@/components/feedback/Toast";
import { PermissionGate } from "@/auth/PermissionGate";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const SECTIONS = [
  { id: "store",         label: "Store Settings",    icon: Store },
  { id: "notifications", label: "Notifications",     icon: Bell },
  { id: "security",      label: "Security",          icon: Shield },
  { id: "appearance",    label: "Appearance",        icon: Palette },
];

const OWNER_SECTIONS = [
  { id: "staff", label: "Staff Members", icon: Users, route: "/settings/staff" },
  { id: "roles", label: "Roles & Perms", icon: ShieldCheck, route: "/settings/roles" },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("store");
  const { session } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const user = session?.user;
  const tenant = session?.tenant;
  const isOwner = user?.type === "owner";

  return (
    <div className="flex gap-5 max-w-[900px]">
      {/* Sidebar */}
      <div className="w-44 shrink-0 space-y-1">
        <nav className="space-y-0.5">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                  activeSection === s.id
                    ? "bg-primary/10 text-primary-hover"
                    : "text-foreground-muted hover:bg-surface-elevated"
                )}
              >
                <Icon size={14} />
                {s.label}
              </button>
            );
          })}
        </nav>

        {/* Owner-only admin links */}
        {isOwner && (
          <>
            <div className="pt-3 pb-1">
              <p className="px-3 text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">
                Administration
              </p>
            </div>
            <nav className="space-y-0.5">
              {OWNER_SECTIONS.map(s => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => navigate(s.route)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground-muted hover:bg-surface-elevated transition-colors"
                  >
                    <Icon size={14} />
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4">
        {activeSection === "store" && (
          <Card>
            <CardHeader title="Store Information" subtitle="Your business details" />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Business Name" defaultValue={tenant?.businessName} />
                <Input label="Owner Name" defaultValue={user?.name} />
              </div>
              <Input label="Email Address" defaultValue={user?.email} />
              <Input label="Phone Number" placeholder="+977 98XXXXXXXX" />
              <Input label="Business Address" placeholder="Kathmandu, Nepal" />
              <div className="flex justify-end">
                <Button size="sm" icon={<Save size={13} />} onClick={() => success("Settings saved!")}>
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        )}

        {activeSection === "notifications" && (
          <Card>
            <CardHeader title="Notification Preferences" subtitle="Control when you get notified" />
            <div className="space-y-3">
              {[
                "New order received",
                "Order status updated",
                "Low stock alert",
                "New customer message",
                "Payment received",
                "Daily sales summary",
              ].map(item => (
                <div key={item} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-foreground">{item}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-surface-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border after:border-border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeSection === "security" && (
          <Card>
            <CardHeader title="Security Settings" subtitle="Manage your account security" />
            <div className="space-y-4">
              <Input label="Current Password" type="password" placeholder="••••••••" />
              <Input label="New Password" type="password" placeholder="••••••••" />
              <Input label="Confirm New Password" type="password" placeholder="••••••••" />
              <div className="flex justify-end">
                <Button size="sm" icon={<Save size={13} />} onClick={() => success("Password updated!")}>
                  Update Password
                </Button>
              </div>
            </div>
          </Card>
        )}

        {activeSection === "appearance" && (
          <Card>
            <CardHeader title="Appearance" subtitle="Choose how SyncSales looks on this device" />
            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium text-foreground-muted mb-3">Theme</p>
                <ThemePicker />
                <p className="text-[11px] text-foreground-muted mt-3">
                  Dark is the default. Your choice is saved on this device and restored on the next visit.
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground-muted mb-2">Language</p>
                <select className="text-sm border border-border rounded-lg px-3 py-2 bg-surface-elevated text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option>English</option>
                  <option>नेपाली (Nepali)</option>
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* Plan info */}
        <PermissionGate permission="settings.manage">
          <Card>
            <CardHeader title="Current Plan" subtitle="Your SyncSales subscription" />
            <div className="flex items-center justify-between">
              <div>
                <span className={cn(
                  "text-xs font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide",
                  tenant?.plan === "pro" ? "bg-primary/10 text-primary-hover border-primary/30" :
                  tenant?.plan === "enterprise" ? "bg-primary-soft text-primary border-primary/30" :
                  "bg-surface-elevated text-foreground-muted border-border"
                )}>
                  {tenant?.plan ?? "Starter"} Plan
                </span>
                <p className="text-xs text-foreground-muted mt-2">
                  Up to 3 staff accounts · All core features included
                </p>
              </div>
              <Button variant="outline" size="sm">Upgrade</Button>
            </div>
          </Card>
        </PermissionGate>
      </div>
    </div>
  );
}
