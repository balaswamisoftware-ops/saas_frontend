"use client";

import { Icon } from "@iconify/react";
import { Button } from "@heroui/react";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu, type UserMenuProps } from "./user-menu";

export interface TopbarProps {
  onMenuClick: () => void;
  user: UserMenuProps;
  /** Optional content rendered on the left (e.g. breadcrumbs or page title). */
  children?: React.ReactNode;
}

/** Sticky top bar shared by both consoles. */
export function Topbar({ onMenuClick, user, children }: TopbarProps) {
  return (
    <header className="border-default-200/70 bg-background/80 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-md sm:px-6">
      <Button
        isIconOnly
        variant="ghost"
        aria-label="Open navigation"
        className="lg:hidden"
        onPress={onMenuClick}
      >
        <Icon icon="lucide:menu" className="size-5" />
      </Button>

      <div className="min-w-0 flex-1">{children}</div>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <UserMenu {...user} />
      </div>
    </header>
  );
}
