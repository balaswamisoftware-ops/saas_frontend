"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@heroui/react";
import { resolveNavHref, type WorkspaceNav } from "@/config/nav";
import type { Workspace } from "@/types";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";
import { SidebarNav } from "./sidebar-nav";
import { Topbar } from "./topbar";
import type { UserMenuProps } from "./user-menu";
import { useAuthStore } from "@/stores/auth.store";

export interface DashboardShellProps {
  nav: WorkspaceNav;
  workspace: Workspace;
  /** Static fallback (mainly `settingsHref`); the real identity comes from the
   *  auth store once the session hydrates. */
  user?: UserMenuProps;
  /** Active tenant slug, used to resolve `{slug}` in tenant nav hrefs. */
  slug?: string;
  children: React.ReactNode;
}

/**
 * The shared application frame: a fixed sidebar on desktop, a slide-over drawer
 * on mobile, and a sticky top bar. Both the SaaS console and the tenant admin
 * dashboard render through this — only the `nav` and `workspace` differ.
 */
export function DashboardShell({ nav, user, slug, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const authUser = useAuthStore((s) => s.user);

  // Identity comes from the real session; the prop only carries `settingsHref`.
  const currentUser: UserMenuProps = {
    name: authUser?.name ?? user?.name,
    email: authUser?.email ?? user?.email,
    avatarUrl: authUser?.avatarUrl ?? user?.avatarUrl,
    settingsHref: user?.settingsHref,
    signOutHref: user?.signOutHref,
  };

  const homeHref = resolveNavHref(nav.basePath, slug) + "/dashboard";

  const sidebarBody = (
    <>
      <div className="flex h-16 items-center px-5">
        <Brand href={homeHref} subtitle={nav.label} />
      </div>
      <SidebarNav nav={nav} slug={slug} onNavigate={() => setMobileOpen(false)} />
    </>
  );

  return (
    <div className="bg-default-50 flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="border-default-200/70 bg-background hidden w-64 shrink-0 flex-col border-r lg:flex">
        {sidebarBody}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="bg-foreground/40 absolute inset-0 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="bg-background absolute inset-y-0 left-0 flex w-72 flex-col shadow-xl">
            <Button
              isIconOnly
              variant="ghost"
              aria-label="Close navigation"
              className="absolute top-3 right-3"
              onPress={() => setMobileOpen(false)}
            >
              <X className="size-5" />
            </Button>
            {sidebarBody}
          </aside>
        </div>
      ) : null}

      {/* Main column */}
      <div className={cn("flex min-w-0 flex-1 flex-col overflow-hidden")}>
        <Topbar onMenuClick={() => setMobileOpen(true)} user={currentUser} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
