import type {
  AuthUser,
  Session,
  Role,
  InviteToken,
  Permission,
  CreateOwnerPayload,
  CreateStaffPayload,
  CreateRolePayload,
} from "@/auth/auth.types";
import { apiClient, tokenStore } from "@/api/client";
import type { PaginatedResponse } from "@/types";

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface BackendUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  type: "owner" | "staff";
  roleId: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  role?: BackendRole;
}

interface BackendTenant {
  id: string;
  businessName: string;
  plan?: string;
  createdAt: string;
  ownerId?: string;
}

interface BackendRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem?: boolean;
  createdAt?: string;
}

interface BackendSession {
  user: BackendUser;
  tenant: BackendTenant;
  role: BackendRole;
  permissions?: string[];
}

interface LoginResponse {
  tokens: Tokens;
  user: BackendUser;
  tenant: BackendTenant;
  role: BackendRole;
  permissions: string[];
}

interface BackendInviteToken {
  token: string;
  tenantId?: string;
  roleId?: string | null;
  invitedEmail?: string;
  expiresAt: string;
  used?: boolean;
  usedAt?: string | null;
  createdAt?: string;
  role?: BackendRole | null;
}

const ACCESS_TTL_SEC = 15 * 60;

function mapUser(u: BackendUser): AuthUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    type: u.type,
    tenantId: u.tenantId,
    roleId: u.roleId,
    isActive: u.isActive ?? true,
    createdAt:
      typeof u.createdAt === "string"
        ? u.createdAt
        : new Date(u.createdAt).toISOString(),
  };
}

function mapTenant(t: BackendTenant) {
  return {
    id: t.id,
    businessName: t.businessName,
    plan: (t.plan ?? "starter") as "starter" | "pro" | "enterprise",
    createdAt:
      typeof t.createdAt === "string"
        ? t.createdAt
        : new Date(t.createdAt).toISOString(),
    ownerId: t.ownerId ?? "",
  };
}

function mapRole(r: BackendRole): Role {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? "",
    permissions: r.permissions as Permission[],
    isSystem: r.isSystem,
    createdAt: r.createdAt ?? new Date().toISOString(),
  };
}

function buildSession(
  user: BackendUser,
  tenant: BackendTenant,
  role: BackendRole,
  accessToken: string,
  permissions?: string[],
): Session {
  return {
    user: mapUser(user),
    tenant: mapTenant(tenant),
    role: mapRole(role),
    permissions: (permissions ?? role.permissions) as Permission[],
    accessToken,
    expiresAt: new Date(Date.now() + ACCESS_TTL_SEC * 1000).toISOString(),
  };
}

async function sessionFromTokens(tokens: Tokens): Promise<Session> {
  tokenStore.set(tokens.accessToken, tokens.refreshToken);
  const me = await apiClient.get<BackendSession>("/auth/me");
  return buildSession(
    me.user,
    me.tenant,
    me.role,
    tokens.accessToken,
    me.permissions,
  );
}

export const authService = {
  getCurrentSession(): Session | null {
    const token = tokenStore.getAccess();
    if (!token) return null;

    const raw = localStorage.getItem("ss_session");
    if (!raw) return null;

    try {
      const session = JSON.parse(raw) as Session;
      if (new Date(session.expiresAt) < new Date()) {
        localStorage.removeItem("ss_session");
        tokenStore.clear();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  async login(email: string, password: string): Promise<Session> {
    const res = await apiClient.post<LoginResponse>("/auth/login", {
      email,
      password,
    });

    const session = buildSession(
      res.user,
      res.tenant,
      res.role,
      res.tokens.accessToken,
      res.permissions,
    );
    tokenStore.set(res.tokens.accessToken, res.tokens.refreshToken);
    localStorage.setItem("ss_session", JSON.stringify(session));
    return session;
  },

  async register(data: Omit<CreateOwnerPayload, "inviteToken">): Promise<Session> {
    const res = await apiClient.post<{ tokens: Tokens; user: BackendUser }>(
      "/auth/register",
      data,
    );

    const session = await sessionFromTokens(res.tokens);
    localStorage.setItem("ss_session", JSON.stringify(session));
    return session;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout", {});
    } catch {
      // best-effort
    } finally {
      tokenStore.clear();
      localStorage.removeItem("ss_session");
    }
  },

  async validateInvite(token: string): Promise<InviteToken> {
    const data = await apiClient.get<BackendInviteToken>(`/auth/invite/${token}`);
    return {
      token: data.token,
      tenantId: data.tenantId ?? "",
      roleId: data.roleId ?? undefined,
      invitedEmail: data.invitedEmail,
      expiresAt: data.expiresAt,
      used: data.used ?? !!data.usedAt,
      createdAt: data.createdAt ?? new Date().toISOString(),
    };
  },

  async createOwner(data: CreateOwnerPayload): Promise<Session> {
    const res = await apiClient.post<{ tokens: Tokens; user: BackendUser }>(
      `/auth/invite/${data.inviteToken}/owner`,
      {
        name: data.name,
        email: data.email,
        password: data.password,
        businessName: data.businessName,
      },
    );

    const session = await sessionFromTokens(res.tokens);
    localStorage.setItem("ss_session", JSON.stringify(session));
    return session;
  },

  async createStaff(_tenantId: string, data: CreateStaffPayload): Promise<AuthUser> {
    if (data.inviteToken) {
      const res = await apiClient.post<{ tokens: Tokens; user: BackendUser }>(
        `/auth/invite/${data.inviteToken}/staff`,
        {
          name: data.name,
          email: data.email,
          password: data.password,
          roleId: data.roleId,
        },
      );
      return mapUser(res.user);
    }

    const user = await apiClient.post<BackendUser>("/users/staff", {
      name: data.name,
      email: data.email,
      password: data.password,
      roleId: data.roleId,
    });
    return mapUser(user);
  },

  async getStaff(_tenantId: string): Promise<AuthUser[]> {
    const res = await apiClient.get<PaginatedResponse<BackendUser>>("/users?pageSize=100");
    return (res?.data || [])
      .filter((u) => u.type === "staff")
      .map(mapUser);
  },

  async setStaffActive(userId: string, isActive: boolean): Promise<void> {
    if (isActive) {
      await apiClient.patch(`/users/${userId}/reactivate`);
    } else {
      await apiClient.patch(`/users/${userId}/deactivate`);
    }
  },

  async assignRole(userId: string, roleId: string): Promise<void> {
    await apiClient.patch(`/users/${userId}`, { roleId });
  },

  async getRoles(_tenantId: string): Promise<Role[]> {
    const roles = await apiClient.get<BackendRole[]>("/roles");
    return (roles || []).map(mapRole);
  },

  async createRole(_tenantId: string, data: CreateRolePayload): Promise<Role> {
    const role = await apiClient.post<BackendRole>("/roles", data);
    return mapRole(role);
  },

  async updateRolePermissions(roleId: string, permissions: Permission[]): Promise<Role> {
    const role = await apiClient.patch<BackendRole>(`/roles/${roleId}`, { permissions });
    return mapRole(role);
  },

  async deleteRole(roleId: string): Promise<void> {
    await apiClient.del(`/roles/${roleId}`);
  },
};
