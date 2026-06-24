"use client";

import { Avatar } from "@heroui/react";
import { Pencil } from "lucide-react";
import { Button, DataTable, StatusChip, type Column } from "@/components/ui";
import type { User } from "@/types";
import { initials, humanize } from "@/lib/utils";
import { formatDate } from "@/lib/format";

export interface UserTableProps {
  users: User[];
  "aria-label": string;
  /** When provided, an Edit action is shown per row. */
  onEdit?: (user: User) => void;
  /** Show the employee's 6-digit login PIN as a column (tenant staff). */
  showPin?: boolean;
}

/** Reusable people table shared by platform "Employees" and tenant "Team". */
export function UserTable({ users, "aria-label": ariaLabel, onEdit, showPin }: UserTableProps) {
  const columns: Column<User>[] = [
    {
      key: "name",
      label: "User",
      isRowHeader: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <Avatar.Image src={u.avatarUrl} alt={u.name} />
            <Avatar.Fallback>{initials(u.name)}</Avatar.Fallback>
          </Avatar>
          <div>
            <p className="font-medium">{u.name}</p>
            <p className="text-foreground/50 text-xs">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "role", label: "Role", render: (u) => u.roleName ?? humanize(u.roleKey ?? u.role) },
    ...(showPin
      ? [
          {
            key: "pin",
            label: "PIN",
            render: (u: User) => (
              <span className="font-mono tracking-widest">{u.pin ?? "—"}</span>
            ),
          } satisfies Column<User>,
        ]
      : []),
    {
      key: "lastActiveAt",
      label: "Last active",
      render: (u) => (u.lastActiveAt ? formatDate(u.lastActiveAt) : "—"),
    },
    { key: "status", label: "Status", render: (u) => <StatusChip status={u.status} /> },
    ...(onEdit
      ? [
          {
            key: "actions",
            label: "",
            align: "end",
            render: (u: User) => (
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label={`Edit ${u.name}`}
                onPress={() => onEdit(u)}
              >
                <Pencil className="size-4" />
              </Button>
            ),
          } satisfies Column<User>,
        ]
      : []),
  ];

  return (
    <DataTable
      aria-label={ariaLabel}
      columns={columns}
      rows={users}
      getRowKey={(u) => u.id}
      emptyTitle="No users yet"
      emptyDescription="Invite teammates to get started."
    />
  );
}
