import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Edit2, ShieldCheck, Loader2, Save, X } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/feedback/Toast";
import { useConfirmDialog } from "@/store";
import { useAuth } from "@/auth/useAuth";
import { authService } from "@/services/authService";
import type { Role, Permission } from "@/auth/auth.types";
import { PERMISSION_GROUPS, PERMISSION_LABELS } from "@/auth/auth.types";
import { cn } from "@/lib/utils";

// ─── Permission Matrix ────────────────────────────────────────────────────────

interface PermissionMatrixProps {
  permissions: Permission[];
  onChange: (permissions: Permission[]) => void;
  disabled?: boolean;
}

function PermissionMatrix({ permissions, onChange, disabled }: PermissionMatrixProps) {
  function toggle(p: Permission) {
    if (permissions.includes(p)) {
      onChange(permissions.filter((x) => x !== p));
    } else {
      onChange([...permissions, p]);
    }
  }

  return (
    <div className="space-y-4">
      {PERMISSION_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider mb-2">{group.label}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {group.permissions.map((p) => {
              const checked = permissions.includes(p);
              return (
                <label
                  key={p}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer select-none transition-colors",
                    disabled ? "cursor-default opacity-60" : "hover:bg-surface-elevated",
                    checked ? "bg-primary/10 border-primary/30" : "bg-surface border-border"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => !disabled && toggle(p)}
                    disabled={disabled}
                    className="w-3.5 h-3.5 accent-primary-600 cursor-pointer"
                  />
                  <span className="text-xs text-foreground">{PERMISSION_LABELS[p]}</span>
                  <code className="ml-auto text-[9px] text-foreground-muted font-mono hidden sm:block">{p}</code>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Role Edit Panel ──────────────────────────────────────────────────────────

interface RoleEditPanelProps {
  role: Role;
  onSave: (permissions: Permission[]) => Promise<void>;
  onClose: () => void;
}

function RoleEditPanel({ role, onSave, onClose }: RoleEditPanelProps) {
  const [permissions, setPermissions] = useState<Permission[]>(role.permissions);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(permissions);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const changed = JSON.stringify(permissions.sort()) !== JSON.stringify([...role.permissions].sort());

  return (
    <div className="border-t border-border pt-4 mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">Editing permissions for: <span className="text-primary">{role.name}</span></p>
        <button onClick={onClose} className="text-foreground-muted hover:text-foreground-muted transition-colors">
          <X size={14} />
        </button>
      </div>
      <PermissionMatrix permissions={permissions} onChange={setPermissions} />
      <div className="flex gap-2 pt-1">
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button
          size="sm"
          icon={<Save size={13} />}
          onClick={handleSave}
          loading={saving}
          disabled={!changed}
        >
          Save Permissions
        </Button>
      </div>
    </div>
  );
}

// ─── New Role Form ────────────────────────────────────────────────────────────

interface NewRoleFormProps {
  onSave: (name: string, description: string, permissions: Permission[]) => Promise<void>;
  onClose: () => void;
}

function NewRoleForm({ onSave, onClose }: NewRoleFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>(["dashboard.view"]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) { setError("Role name is required."); return; }
    setError("");
    setSaving(true);
    try {
      await onSave(name.trim(), description.trim(), permissions);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create role.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-surface-elevated border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-foreground">New Role</p>
        <button onClick={onClose} className="text-foreground-muted hover:text-foreground-muted"><X size={14} /></button>
      </div>
      {error && <p className="text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Role Name" placeholder="e.g. Sales Manager" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Description" placeholder="What this role can do" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <PermissionMatrix permissions={permissions} onChange={setPermissions} />
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" icon={<Save size={13} />} onClick={handleSave} loading={saving}>
          Create Role
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const { session, updateRolePermissions, createRole, deleteRole } = useAuth();
  const { success, error: showError } = useToast();
  const confirm = useConfirmDialog((s) => s.confirm);

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const tenantId = session?.tenant.id ?? "";

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const list = await authService.getRoles(tenantId);
    setRoles(list);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  async function handleSavePermissions(roleId: string, permissions: Permission[]) {
    try {
      await updateRolePermissions(roleId, permissions);
      success("Permissions updated successfully.");
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to save permissions.");
      throw err;
    }
  }

  async function handleCreateRole(name: string, description: string, permissions: Permission[]) {
    await createRole({ name, description, permissions });
    success(`Role "${name}" created.`);
    await load();
  }

  function handleDeleteRole(role: Role) {
    confirm({
      title: "Delete Role",
      description: `Delete "${role.name}"? Any staff with this role will be set to Viewer access.`,
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteRole(role.id);
          success(`Role "${role.name}" deleted.`);
          await load();
        } catch (err) {
          showError(err instanceof Error ? err.message : "Failed to delete role.");
        }
      },
    });
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">Roles & Permissions</h2>
          <p className="text-xs text-foreground-muted mt-0.5">Control what each role can access in the dashboard</p>
        </div>
        {!showNewForm && (
          <Button icon={<Plus size={14} />} size="sm" onClick={() => setShowNewForm(true)}>
            New Role
          </Button>
        )}
      </div>

      {showNewForm && (
        <NewRoleForm
          onSave={handleCreateRole}
          onClose={() => setShowNewForm(false)}
        />
      )}

      {/* Roles list */}
      <Card>
        <CardHeader title="All Roles" subtitle="System roles are protected and cannot be modified." />
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="text-primary animate-spin" />
          </div>
        ) : (
          <div className="space-y-0">
            {roles.map((role) => {
              const isEditing = editingRoleId === role.id;
              return (
                <div key={role.id} className="border-b border-border last:border-0 py-4 px-5">
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      role.isSystem ? "bg-surface-elevated" : "bg-primary/10"
                    )}>
                      <ShieldCheck size={15} className={role.isSystem ? "text-foreground-muted" : "text-primary"} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{role.name}</p>
                        {role.isSystem && (
                          <span className="text-[9px] font-bold bg-surface-elevated text-foreground-muted px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            System
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground-muted truncate">{role.description}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {role.permissions.slice(0, 5).map((p) => (
                          <span key={p} className="text-[9px] font-medium bg-surface-elevated text-foreground-muted px-1.5 py-0.5 rounded">
                            {p}
                          </span>
                        ))}
                        {role.permissions.length > 5 && (
                          <span className="text-[9px] font-medium bg-surface-elevated text-foreground-muted px-1.5 py-0.5 rounded">
                            +{role.permissions.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {!role.isSystem && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingRoleId(isEditing ? null : role.id)}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors text-foreground-muted hover:text-primary hover:bg-primary/10",
                            isEditing && "bg-primary/10 text-primary"
                          )}
                          title="Edit permissions"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role)}
                          className="p-1.5 rounded-lg text-foreground-muted hover:text-error hover:bg-error/10 transition-colors"
                          title="Delete role"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inline edit panel */}
                  {isEditing && (
                    <RoleEditPanel
                      role={role}
                      onSave={(perms) => handleSavePermissions(role.id, perms)}
                      onClose={() => setEditingRoleId(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
