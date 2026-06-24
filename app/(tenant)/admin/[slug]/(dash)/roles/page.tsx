"use client";
import { useAdminPath } from "@/lib/use-admin-path";

import { useRouter, useParams } from "next/navigation";
import { Check, Plus, ShieldCheck, UserCog } from "lucide-react";
import { Button, Card, Chip, PageHeader, RefreshButton } from "@/components/ui";
import { useResource, useEmployees } from "@/hooks";
import { tenantApi, type RoleDoc } from "@/lib/api/services";
import { humanize } from "@/lib/utils";

/** A role that can manage staff if it holds employee/role or wildcard rights. */
function canManageTeam(permissions: string[]): boolean {
  return permissions.some(
    (p) => p === "*" || p.startsWith("employees:") || p.startsWith("roles:"),
  );
}

/** Turn a `module:action` permission into a readable label. */
function permissionLabel(permission: string): string {
  if (permission === "*") return "Full access";
  const [mod, action] = permission.split(":");
  return action === "*" ? `Manage ${humanize(mod)}` : `${humanize(action)} ${humanize(mod)}`;
}

export default function RolesPage() {
  const router = useRouter();
  const adminPath = useAdminPath();
  const { slug } = useParams<{ slug: string }>();

  const { items: roles, reload } = useResource<RoleDoc>(tenantApi(slug).roles, { limit: 100 });
  const { employees } = useEmployees(slug);

  const countFor = (roleId: string) => employees.filter((e) => e.roleId === roleId).length;

  return (
    <div>
      <PageHeader
        title="Roles"
        description="What each type of employee can do. Assign a role to an employee from the Employees page."
        actions={
          <>
            <RefreshButton onRefresh={reload} />
            <Button variant="primary" onPress={() => router.push(adminPath("/roles/new"))}>
              <Plus className="size-4" /> New role
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => {
          const manages = canManageTeam(role.permissions);
          const count = countFor(role.id);
          return (
            <Card key={role.id} className="flex flex-col p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="bg-default-100 text-foreground/70 grid size-9 place-items-center rounded-lg">
                  {manages ? <ShieldCheck className="size-4.5" /> : <UserCog className="size-4.5" />}
                </span>
                {manages ? (
                  <Chip size="sm" variant="soft" color="success">
                    Can manage team
                  </Chip>
                ) : null}
              </div>

              <h2 className="mt-3 font-semibold">{role.name}</h2>
              <p className="text-foreground/55 mt-1 text-sm">{role.description}</p>
              <p className="text-foreground/50 mt-2 text-xs">
                {count} {count === 1 ? "employee" : "employees"}
              </p>

              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {(role.permissions.includes("*")
                  ? ["*"]
                  : role.permissions.filter((p) => p.endsWith(":*") || p === "*")
                ).map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <Check className="text-success mt-0.5 size-4 shrink-0" />
                    <span>{permissionLabel(p)}</span>
                  </li>
                ))}
                {!role.permissions.includes("*") &&
                role.permissions.filter((p) => p.endsWith(":*")).length === 0 ? (
                  <li className="text-foreground/50">
                    {role.permissions.length} permission{role.permissions.length === 1 ? "" : "s"}
                  </li>
                ) : null}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
