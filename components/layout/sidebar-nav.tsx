"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { Chip } from "@heroui/react";
import { resolveNavHref, type WorkspaceNav } from "@/config/nav";
import { cn } from "@/lib/utils";

export interface SidebarNavProps {
  nav: WorkspaceNav;
  /** Active tenant slug, injected into `{slug}` placeholders in nav hrefs. */
  slug?: string;
  /** Called after navigating — used to close the mobile drawer. */
  onNavigate?: () => void;
}

/** The list of nav sections/links. Shared by the desktop sidebar and the
 *  mobile drawer so the two never drift apart. */
export function SidebarNav({ nav, slug, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  // Highlight only the most specific matching item, so a deep route like
  // `/admin/acme/bookings/123/edit` lights up "Bookings", not a shorter prefix.
  const activeHref = nav.sections
    .flatMap((s) => s.items.map((i) => resolveNavHref(i.href, slug)))
    .filter((href) => pathname === href || pathname.startsWith(href + "/"))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {nav.sections.map((section, i) => (
        <div key={section.title ?? i} className="space-y-1">
          {section.title ? (
            <p className="text-foreground/40 px-3 pb-1 text-xs font-semibold tracking-wider uppercase">
              {section.title}
            </p>
          ) : null}
          {section.items.map((item) => {
            const href = resolveNavHref(item.href, slug);
            const active = href === activeHref;
            return (
              <Link
                key={item.href}
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:bg-default-100 hover:text-foreground",
                )}
              >
                <Icon icon={item.icon} className="size-4.5 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge ? (
                  <Chip size="sm" variant="soft" color="default">
                    {item.badge}
                  </Chip>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
