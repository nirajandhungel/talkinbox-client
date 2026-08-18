import { useState, useEffect, useCallback } from "react";
import { UserPlus, MoreVertical, ShieldCheck, Power, PowerOff, Loader2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/feedback/Toast";
import { useConfirmDialog } from "@/store";
import { useAuth } from "@/auth/useAuth";
import { authService } from "@/services/authService";
import type { AuthUser, Role } from "@/auth/auth.types";
import { cn } from "@/lib/utils";

const MAX_STAFF = 3;

// ─── Add Staff Modal ──────────────────────────────────────────────────────────

interface AddStaffModalProps {
  roles: Role[];
  onAdd: (data: { name: string; email: string; password: string; roleId: string }) => Promise<void>;
  onClose: () => void;
}

function AddStaffModal({ roles, onAdd, onClose }: AddStaffModalProps) {
  const [form, setForm] = useState({ name: "", email: "", password: "", roleId: roles[0]?.id ?? "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const assignableRoles = roles.filter((r) => !r.isSystem || r.id === "role-viewer");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError("");
    setSubmitting(true);
    try {
      await onAdd(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add staff.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Add Staff Member</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
          <Input label="Full Name" placeholder="Jane Smith" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Input label="Email" type="email" placeholder="jane@company.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          <Input
            label="Temporary Password"
            type="password"
            placeholder="Min. 6 characters"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
          />
          <Select
            label="Assign Role"
            options={assignableRoles.map((r) => ({ label: r.name, value: r.id }))}
            value={form.roleId}
            onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
          />
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" className="flex-1" onClick={onClose} type="button">Cancel</Button>
            <Button className="flex-1" type="submit" loading={submitting} icon={<UserPlus size={14} />}>
              Add Staff
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Staff Row ────────────────────────────────────────────────────────────────

interface StaffRowProps {
  staff: AuthUser;
  roleName: string;
  onDeactivate: () => void;
  onReactivate: () => void;
  onChangeRole: (roleId: string) => void;
  roles: Role[];
  isSelf: boolean;
}

function StaffRow({ staff, roleName, onDeactivate, onReactivate, onChangeRole, roles, isSelf }: StaffRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = staff.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const assignableRoles = roles.filter((r) => !r.isSystem || r.id === "role-viewer");

  return (
    <div className={cn(
      "flex items-center gap-4 py-4 px-5 border-b border-slate-50 last:border-0 transition-colors",
      !staff.isActive && "opacity-60"
    )}>
      <Avatar initials={initials} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-800 truncate">{staff.name}</p>
          {isSelf && <span className="text-[10px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-full font-medium">You</span>}
          {!staff.isActive && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">Inactive</span>}
        </div>
        <p className="text-xs text-slate-500 truncate">{staff.email}</p>
      </div>

      {/* Role inline select */}
      <select
        value={staff.roleId}
        onChange={(e) => onChangeRole(e.target.value)}
        disabled={!staff.isActive || isSelf}
        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
      >
        {assignableRoles.map((r) => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>

      {/* Role badge */}
      <span className="hidden sm:block text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full min-w-[70px] text-center">
        {roleName}
      </span>

      {/* Actions kebab */}
      {!isSelf && (
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <MoreVertical size={14} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-card-lg border border-slate-100 w-40 overflow-hidden">
                {staff.isActive ? (
                  <button
                    onClick={() => { onDeactivate(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <PowerOff size={13} /> Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() => { onReactivate(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-green-600 hover:bg-green-50 transition-colors"
                  >
                    <Power size={13} /> Reactivate
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StaffManagementPage() {
  const { session, createStaff, deactivateStaff, reactivateStaff, assignRoleToStaff } = useAuth();
  const { success, error: showError } = useToast();
  const confirm = useConfirmDialog((s) => s.confirm);

  const [staff, setStaff] = useState<AuthUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const tenantId = session?.tenant.id ?? "";

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [staffList, roleList] = await Promise.all([
      authService.getStaff(tenantId),
      authService.getRoles(tenantId),
    ]);
    setStaff(staffList);
    setRoles(roleList);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const activeCount = staff.filter((s) => s.isActive).length;
  const canAddMore = activeCount < MAX_STAFF;

  async function handleAdd(data: { name: string; email: string; password: string; roleId: string }) {
    await createStaff(data);
    success(`${data.name} added as staff.`);
    await load();
  }

  async function handleDeactivate(s: AuthUser) {
    confirm({
      title: "Deactivate Staff",
      description: `Deactivate ${s.name}? They will lose dashboard access immediately.`,
      variant: "danger",
      onConfirm: async () => {
        try {
          await deactivateStaff(s.id);
          success(`${s.name} deactivated.`);
          await load();
        } catch (err) {
          showError(err instanceof Error ? err.message : "Failed to deactivate.");
        }
      },
    });
  }

  async function handleReactivate(s: AuthUser) {
    try {
      await reactivateStaff(s.id);
      success(`${s.name} reactivated.`);
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to reactivate.");
    }
  }

  async function handleChangeRole(s: AuthUser, roleId: string) {
    try {
      await assignRoleToStaff(s.id, roleId);
      success(`Role updated for ${s.name}.`);
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update role.");
    }
  }

  const getRoleName = (roleId: string) => roles.find((r) => r.id === roleId)?.name ?? roleId;

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Staff Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeCount} of {MAX_STAFF} active staff accounts
          </p>
        </div>
        <Button
          icon={<UserPlus size={14} />}
          size="sm"
          onClick={() => setShowAddModal(true)}
          disabled={!canAddMore}
          title={!canAddMore ? "Maximum 3 staff accounts reached" : undefined}
        >
          Add Staff
        </Button>
      </div>

      {/* Limit warning */}
      {!canAddMore && (
        <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <ShieldCheck size={15} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700">
            You've reached the maximum of {MAX_STAFF} active staff accounts. Deactivate one to add another.
          </p>
        </div>
      )}

      {/* Staff list */}
      <Card>
        <CardHeader title="Your Team" subtitle="Manage team members and their roles" />
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="text-primary-600 animate-spin" />
          </div>
        ) : staff.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-500">No staff members yet. Add your first team member.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {staff.map((s) => (
              <StaffRow
                key={s.id}
                staff={s}
                roleName={getRoleName(s.roleId)}
                roles={roles}
                isSelf={s.id === session?.user.id}
                onDeactivate={() => handleDeactivate(s)}
                onReactivate={() => handleReactivate(s)}
                onChangeRole={(roleId) => handleChangeRole(s, roleId)}
              />
            ))}
          </div>
        )}
      </Card>

      {showAddModal && (
        <AddStaffModal
          roles={roles}
          onAdd={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
