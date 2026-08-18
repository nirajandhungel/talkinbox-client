import { useState } from "react";
import { Save, Store, Bell, Shield, Palette, Users, ShieldCheck } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-100"
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
              <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
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
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
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
                <div key={item} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-700">{item}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600" />
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
            <CardHeader title="Appearance" subtitle="Customize your dashboard" />
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Theme Color</p>
                <div className="flex gap-2">
                  {["#006D5B", "#3B82F6", "#8B5CF6", "#EF4444", "#F59E0B"].map(color => (
                    <button
                      key={color}
                      className="w-7 h-7 rounded-full ring-2 ring-offset-2 ring-transparent hover:ring-slate-300 transition-all"
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Language</p>
                <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none">
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
                  tenant?.plan === "pro" ? "bg-primary-50 text-primary-700 border-primary-200" :
                  tenant?.plan === "enterprise" ? "bg-purple-50 text-purple-700 border-purple-200" :
                  "bg-slate-100 text-slate-600 border-slate-200"
                )}>
                  {tenant?.plan ?? "Starter"} Plan
                </span>
                <p className="text-xs text-slate-500 mt-2">
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
