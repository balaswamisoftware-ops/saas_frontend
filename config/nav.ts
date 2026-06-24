import type { Workspace } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  /** Iconify icon name, e.g. `"lucide:building-2"`. Plain strings serialize
   *  across the server→client boundary; component refs do not. */
  icon: string;
  /** Optional badge text shown on the right of the nav row. */
  badge?: string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export interface WorkspaceNav {
  /** Base path for the workspace, e.g. `/saas` or `/admin`. */
  basePath: string;
  /** Label shown in the workspace switcher / header. */
  label: string;
  sections: NavSection[];
}

/** SaaS platform console — for super-admins running the whole product. */
export const platformNav: WorkspaceNav = {
  basePath: "/saas",
  label: "Platform Console",
  sections: [
    {
      items: [
        { label: "Overview", href: "/saas/dashboard", icon: "lucide:layout-dashboard" },
      ],
    },
    {
      title: "Customers",
      items: [
        { label: "Tenants", href: "/saas/tenants", icon: "lucide:building-2" },
      ],
    },
    {
      title: "Administration",
      items: [
        { label: "Employees", href: "/saas/employees", icon: "lucide:users" },
        { label: "Roles", href: "/saas/roles", icon: "lucide:shield-check" },
        { label: "Audit Logs", href: "/saas/audit-logs", icon: "lucide:scroll-text" },
      ],
    },
  ],
};

/**
 * Tenant admin dashboard — for an organisation managing its own CRM.
 * Hrefs contain a `{slug}` placeholder that is resolved to the active tenant's
 * slug at render time (see `resolveNavHref`).
 */
export const tenantNav: WorkspaceNav = {
  basePath: "/admin/{slug}",
  label: "Admin Dashboard",
  sections: [
    {
      items: [
        { label: "Dashboard", href: "/admin/{slug}/dashboard", icon: "lucide:layout-dashboard" },
      ],
    },
    {
      title: "Quick Actions",
      items: [
        { label: "Counter Sale", href: "/admin/{slug}/counter-sale", icon: "lucide:scan-barcode" },
        { label: "New Donation", href: "/admin/{slug}/new-donation", icon: "lucide:hand-coins" },
      ],
    },
    {
      title: "CRM",
      items: [
        { label: "Devotees", href: "/admin/{slug}/devotees", icon: "lucide:contact" },
        { label: "Sevas", href: "/admin/{slug}/sevas", icon: "lucide:hand-heart" },
        { label: "Bookings", href: "/admin/{slug}/bookings", icon: "lucide:calendar-days" },
        { label: "Donations", href: "/admin/{slug}/donations", icon: "lucide:heart-handshake" },
        { label: "Donation Purposes", href: "/admin/{slug}/donation-purposes", icon: "lucide:list-checks" },
        { label: "Events", href: "/admin/{slug}/events", icon: "lucide:calendar-days" },
      ],
    },
    {
      title: "Engage",
      items: [
        { label: "Reports", href: "/admin/{slug}/reports", icon: "lucide:bar-chart-3" },
      ],
    },
    {
      title: "Hardware",
      items: [
        { label: "Printers", href: "/admin/{slug}/printers", icon: "lucide:printer" },
        { label: "Receipt Layouts", href: "/admin/{slug}/receipt-layouts", icon: "lucide:receipt-text" },
      ],
    },
    {
      title: "Organisation",
      items: [
        { label: "Employees", href: "/admin/{slug}/employees", icon: "lucide:users" },
        { label: "Roles", href: "/admin/{slug}/roles", icon: "lucide:shield-check" },
        { label: "Settings", href: "/admin/{slug}/settings", icon: "lucide:settings" },
      ],
    },
  ],
};

/** Replace the `{slug}` placeholder in a nav href/basePath with the real slug. */
export function resolveNavHref(href: string, slug?: string): string {
  return href.replaceAll("{slug}", slug ?? "");
}

export const workspaceNav: Record<Workspace, WorkspaceNav> = {
  platform: platformNav,
  tenant: tenantNav,
};
