import { api } from "./client";
import type { ListParams, PageMeta } from "./types";
import type {
  Booking,
  CrmEvent,
  Devotee,
  Donation,
  DonationPurpose,
  Printer,
  ReceiptLayout,
  Seva,
  Tenant,
  User,
} from "@/types";
import type { ReceiptDesign } from "@/lib/receipt";

/**
 * Generic REST resource client. Every collection in the app gets full typed
 * CRUD from a single factory call — the reuse mirror of the backend's
 * `buildCrudRouter`.
 */
export interface ResourceClient<T> {
  list(params?: ListParams): Promise<{ items: T[]; meta: PageMeta }>;
  get(id: string): Promise<T>;
  create(body: Partial<T>): Promise<T>;
  update(id: string, body: Partial<T>): Promise<T>;
  remove(id: string): Promise<{ id: string }>;
}

export function createResource<T>(basePath: string): ResourceClient<T> {
  return {
    list: (params) => api.list<T>(basePath, { params }),
    get: (id) => api.get<T>(`${basePath}/${id}`),
    create: (body) => api.post<T>(basePath, body),
    update: (id, body) => api.patch<T>(`${basePath}/${id}`, body),
    remove: (id) => api.delete<{ id: string }>(`${basePath}/${id}`),
  };
}

/* ── Auth ─────────────────────────────────────────────────────────────── */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  scope: "platform" | "tenant";
  tenantId: string | null;
  roleKey: string | null;
  roleName: string | null;
  permissions: string[];
  canImpersonate: boolean;
  status: string;
  avatarUrl?: string;
  mustChangePassword: boolean;
}

export interface LoginResult {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: (body: { email: string; password: string; tenantSlug?: string }) =>
    api.post<LoginResult>("/auth/login", body),
  /** Tenant staff sign-in by 6-digit PIN within a workspace. */
  pinLogin: (body: { tenantSlug: string; pin: string }) =>
    api.post<LoginResult>("/auth/pin-login", body),
  refresh: (refreshToken: string) =>
    api.post<LoginResult>("/auth/refresh", { refreshToken }),
  logout: (refreshToken?: string) => api.post<unknown>("/auth/logout", { refreshToken }),
  me: () => api.get<SessionUser>("/auth/me"),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api.post<unknown>("/auth/change-password", body),
};

/* ── Platform (SaaS console) ──────────────────────────────────────────── */
export const tenantsApi = {
  ...createResource<Tenant>("/tenants"),
  stats: () => api.get<{ total: number; active: number; suspended: number; pending: number; mrr: number }>(
    "/tenants/stats"
  ),
  /** Returns the created tenant plus the generated owner credentials. */
  createWithOwner: (body: { name: string; ownerEmail: string; plan?: string; country?: string }) =>
    api.post<{ tenant: Tenant; owner: { email: string; temporaryPassword: string; pin: string } }>(
      "/tenants",
      body
    ),
};

/** A role document as returned by the API. */
export interface RoleDoc {
  id: string;
  key: string;
  name: string;
  description?: string;
  scope: "platform" | "tenant";
  permissions: string[];
  isSystem: boolean;
  canImpersonate?: boolean;
}

/** Permission catalogue for building the role editor. */
export interface PermissionCatalog {
  modules: { key: string; actions: { action: string; permission: string }[] }[];
  actions: string[];
}

function rolesClient(basePath: string) {
  return {
    ...createResource<RoleDoc>(basePath),
    catalog: () => api.get<PermissionCatalog>(`${basePath}/catalog`),
  };
}

export const platformApi = {
  employees: createResource<User>("/platform/employees"),
  roles: rolesClient("/platform/roles"),
  auditLogs: createResource<unknown>("/platform/audit-logs"),
  dashboard: () => api.get<{ metrics: { label: string; value: string }[] }>("/platform/dashboard/stats"),
};

/* ── Tenant workspace (scoped by slug) ────────────────────────────────── */
export function tenantApi(slug: string) {
  const base = `/t/${slug}`;
  return {
    devotees: {
      ...createResource<Devotee>(`${base}/devotees`),
      /** Look up a devotee by phone, registering a new one if none exists. */
      findOrCreate: (body: {
        phone: string;
        name?: string;
        gotra?: string;
        nakshatra?: string;
        email?: string;
      }) => api.post<{ devotee: Devotee; created: boolean }>(`${base}/devotees/find-or-create`, body),
    },
    sevas: createResource<Seva>(`${base}/sevas`),
    bookings: createResource<Booking>(`${base}/bookings`),
    donations: createResource<Donation>(`${base}/donations`),
    donationPurposes: createResource<DonationPurpose>(`${base}/donation-purposes`),
    events: createResource<CrmEvent>(`${base}/events`),
    printers: createResource<Printer>(`${base}/printers`),
    employees: createResource<User>(`${base}/employees`),
    roles: rolesClient(`${base}/roles`),
    auditLogs: createResource<unknown>(`${base}/audit-logs`),
    dashboard: () => api.get<{ metrics: { label: string; value: string }[] }>(`${base}/dashboard/stats`),
    reports: () => api.get<TenantReports>(`${base}/dashboard/reports`),
    revertAudit: (id: string) => api.post<unknown>(`${base}/audit-logs/${id}/revert`),
    settings: {
      get: () => api.get<TenantSettings>(`${base}/settings`),
      update: (body: Partial<TenantSettings>) => api.patch<TenantSettings>(`${base}/settings`, body),
    },
  };
}

/** Aggregated analytics for the tenant Reports page. */
export interface TenantReports {
  monthly: { month: string; amount: number }[];
  bySeva: { name: string; amount: number; share: number }[];
  ytd: number;
}

/** A tenant's organisation profile (Settings page). */
export interface TenantSettings {
  name: string;
  slug: string;
  legalName?: string;
  supportEmail?: string;
  website?: string;
  phone?: string;
  altPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  gstin?: string;
  pan?: string;
  reg80g?: string;
  reg12a?: string;
  trustRegNo?: string;
  currency?: string;
  timezone?: string;
  /** Receipt layout designs keyed by paper size ("55mm" | "80mm" | "a4"). */
  receiptLayouts?: Partial<Record<ReceiptLayout, ReceiptDesign>>;
}
