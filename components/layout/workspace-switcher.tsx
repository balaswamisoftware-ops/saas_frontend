"use client";

import { Icon } from "@iconify/react";
import { Dropdown } from "@heroui/react";
import type { Workspace } from "@/types";

export interface WorkspaceSwitcherProps {
  current: Workspace;
  /** Active tenant slug, used to build the tenant dashboard link. */
  slug?: string;
}

/**
 * Lets staff with access to both surfaces jump between the SaaS platform console
 * and the tenant admin dashboard.
 */
export function WorkspaceSwitcher({ current, slug }: WorkspaceSwitcherProps) {
  const workspaces: { id: Workspace; label: string; href: string; icon: string }[] = [
    { id: "platform", label: "Platform Console", href: "/saas/dashboard", icon: "lucide:layout-grid" },
    {
      id: "tenant",
      label: "Admin Dashboard",
      href: slug ? `/admin/${slug}/dashboard` : "/saas/tenants",
      icon: "lucide:building-2",
    },
  ];
  const active = workspaces.find((w) => w.id === current) ?? workspaces[0];

  return (
    <Dropdown>
      <Dropdown.Trigger className="border-default-200 hover:bg-default-100 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors">
        <Icon icon={active.icon} className="text-foreground/60 size-4" />
        <span className="flex-1 truncate text-left font-medium">{active.label}</span>
        <Icon icon="lucide:chevrons-up-down" className="text-foreground/40 size-4" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom start" className="min-w-56">
        <Dropdown.Menu aria-label="Switch workspace">
          {workspaces.map((w) => (
            <Dropdown.Item key={w.id} href={w.href}>
              <Icon icon={w.icon} className="size-4" />
              <span className="flex-1">{w.label}</span>
              {w.id === current ? (
                <Icon icon="lucide:check" className="text-primary size-4" />
              ) : null}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
