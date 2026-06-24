"use client";

import { useRouter } from "next/navigation";
import { Avatar, Dropdown } from "@heroui/react";
import { LogOut, Settings } from "lucide-react";
import { initials } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";

export interface UserMenuProps {
  name?: string;
  email?: string;
  avatarUrl?: string;
  /** Where the "Settings" item links to. Omit to hide it (e.g. the SaaS
   *  console has no settings page). */
  settingsHref?: string;
  /** Where "Sign out" returns to. Defaults to the generic `/login`; the tenant
   *  console passes its slug-scoped login. */
  signOutHref?: string;
}

/** Avatar + dropdown shown in the top bar of both consoles. Reflects the
 *  signed-in user from the auth store. */
export function UserMenu({ name, email, avatarUrl, settingsHref, signOutHref }: UserMenuProps) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const displayName = name?.trim() || "Account";

  async function signOut() {
    await logout();
    router.push(signOutHref ?? "/login");
  }

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label="Account menu"
        className="hover:bg-default-100 flex items-center gap-2 rounded-full p-1 pr-2 transition-colors"
      >
        <Avatar size="sm">
          <Avatar.Image src={avatarUrl} alt={displayName} />
          <Avatar.Fallback>{initials(displayName)}</Avatar.Fallback>
        </Avatar>
        <span className="hidden text-left sm:block">
          <span className="block text-sm leading-tight font-medium">{displayName}</span>
          {email ? (
            <span className="text-foreground/50 block text-xs leading-tight">{email}</span>
          ) : null}
        </span>
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu aria-label="Account">
          {settingsHref ? (
            <Dropdown.Item href={settingsHref}>
              <Settings className="size-4" /> Settings
            </Dropdown.Item>
          ) : null}
          <Dropdown.Item onAction={signOut}>
            <LogOut className="size-4" /> Sign out
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
