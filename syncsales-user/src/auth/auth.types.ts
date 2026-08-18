// ─── Permission Definitions ──────────────────────────────────────────────────

export const ALL_PERMISSIONS = [
    "dashboard.view",
    "orders.read",
    "orders.manage",
    "inventory.read",
    "inventory.write",
    "customers.read",
    "analytics.view",
    "revenue.view",
    "accounting.view",
    "inbox.manage",
    "settings.manage",
    "staff.manage",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

// ─── Permission Groups (for UI) ──────────────────────────────────────────────

export interface PermissionGroup {
    label: string;
    permissions: Permission[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
    {
        label: "Dashboard",
        permissions: ["dashboard.view"],
    },
    {
        label: "Orders",
        permissions: ["orders.read", "orders.manage"],
    },
    {
        label: "Inventory",
        permissions: ["inventory.read", "inventory.write"],
    },
    {
        label: "Customers",
        permissions: ["customers.read"],
    },
    {
        label: "Analytics & Finance",
        permissions: ["analytics.view", "revenue.view", "accounting.view"],
    },
    {
        label: "Inbox",
        permissions: ["inbox.manage"],
    },
    {
        label: "Administration",
        permissions: ["settings.manage", "staff.manage"],
    },
];

export const PERMISSION_LABELS: Record<Permission, string> = {
    "dashboard.view": "View Dashboard",
    "orders.read": "View Orders",
    "orders.manage": "Manage Orders",
    "inventory.read": "View Inventory",
    "inventory.write": "Edit Inventory",
    "customers.read": "View Customers",
    "analytics.view": "View Analytics",
    "revenue.view": "View Revenue",
    "accounting.view": "View Accounting",
    "inbox.manage": "Manage Inbox",
    "settings.manage": "Manage Settings",
    "staff.manage": "Manage Staff",
};

// ─── Role ─────────────────────────────────────────────────────────────────────

export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: Permission[];
    isSystem?: boolean; // system roles cannot be deleted
    createdAt: string;
}

// ─── Tenant ──────────────────────────────────────────────────────────────────

export interface Tenant {
    id: string;
    businessName: string;
    plan: "starter" | "pro" | "enterprise";
    createdAt: string;
    ownerId: string;
}

// ─── Auth User Types ──────────────────────────────────────────────────────────

export type AuthUserType = "owner" | "staff";

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    type: AuthUserType;
    tenantId: string;
    roleId: string; // references Role.id
    avatar?: string;
    isActive: boolean;
    createdAt: string;
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface Session {
    user: AuthUser;
    tenant: Tenant;
    role: Role;
    permissions: Permission[];
    accessToken: string; // mock JWT-like token
    expiresAt: string;
}

// ─── Invite Token ─────────────────────────────────────────────────────────────

export interface InviteToken {
    token: string;
    tenantId: string;
    roleId?: string; // if set, this is a staff invite; if not, it's owner invite
    invitedEmail?: string;
    expiresAt: string;
    used: boolean;
    createdAt: string;
}

// ─── Auth Context ─────────────────────────────────────────────────────────────

export interface AuthContextValue {
    session: Session | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Auth actions
    login: (email: string, password: string) => Promise<void>;
    register: (data: Omit<CreateOwnerPayload, "inviteToken">) => Promise<void>;
    logout: () => Promise<void>;

    // Invite flow
    validateInvite: (token: string) => Promise<InviteToken>;
    createOwner: (data: CreateOwnerPayload) => Promise<void>;
    createStaff: (data: CreateStaffPayload) => Promise<void>;

    // Role management
    updateRolePermissions: (roleId: string, permissions: Permission[]) => Promise<void>;
    createRole: (data: CreateRolePayload) => Promise<Role>;
    deleteRole: (roleId: string) => Promise<void>;

    // Staff management
    deactivateStaff: (userId: string) => Promise<void>;
    reactivateStaff: (userId: string) => Promise<void>;
    assignRoleToStaff: (userId: string, roleId: string) => Promise<void>;

    // Permission checks
    hasPermission: (permission: Permission) => boolean;
    hasAnyPermission: (permissions: Permission[]) => boolean;
}

// ─── Payload Types ────────────────────────────────────────────────────────────

export interface CreateOwnerPayload {
    name: string;
    email: string;
    password: string;
    businessName: string;
    inviteToken?: string;
}

export interface CreateStaffPayload {
    name: string;
    email: string;
    password: string;
    roleId: string;
    inviteToken?: string;
}

export interface CreateRolePayload {
    name: string;
    description: string;
    permissions: Permission[];
}

export interface LoginCredentials {
    email: string;
    password: string;
}
