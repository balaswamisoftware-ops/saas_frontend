"use client";

import { useRouter } from "next/navigation";
import { Check, Plus, ShieldCheck, UserCog } from "lucide-react";
import {
  Button,
  Card,
  Chip,
  PageHeader,
  RefreshButton,
} from "@/components/ui";
import { useApi, useEmployees } from "@/hooks";
import { platformApi } from "@/lib/api/services";

interface SaasRole {
  id: string;
  key: string;
  name: string;
  description: string;
  permissions: string[];
  canImpersonate: boolean;
}

interface RoleDoc {
  id?: string;
  key?: string;
  name?: string;
  description?: string;
  permissions?: string[];
  canImpersonate?: boolean;
}

export default function RolesPage() {
  const router = useRouter();
  const { data } = useApi(() => platformApi.roles.list(), []);
  const { employees } = useEmployees();

  const list: SaasRole[] = ((data?.items as RoleDoc[] | undefined) ?? []).map((r) => ({
    id: String(r.id ?? r.key ?? ""),
    key: String(r.key ?? r.id ?? ""),
    name: r.name ?? "",
    description: r.description ?? "",
    permissions: r.permissions ?? [],
    canImpersonate: Boolean(r.canImpersonate),
  }));

  const employeeCount = (role: SaasRole) =>
    employees.filter((e) => e.roleKey === role.key).length;

  return (
    <div>
      <PageHeader
        title="Roles"
        description="What each type of platform employee can do. A role can impersonate tenants only if it has the “Impersonate tenants” permission."
        actions={
          <>
            <RefreshButton />
            <Button variant="primary" onPress={() => router.push("/saas/roles/new")}>
              <Plus className="size-4" /> New role
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {list.map((role) => {
          const count = employeeCount(role);
          return (
            <Card key={role.key} className="flex flex-col p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="bg-default-100 text-foreground/70 grid size-9 place-items-center rounded-lg">
                  {role.canImpersonate ? (
                    <ShieldCheck className="size-4.5" />
                  ) : (
                    <UserCog className="size-4.5" />
                  )}
                </span>
                {role.canImpersonate ? (
                  <Chip size="sm" variant="soft" color="success">
                    Can impersonate
                  </Chip>
                ) : null}
              </div>

              <h2 className="mt-3 font-semibold">{role.name}</h2>
              <p className="text-foreground/55 mt-1 text-sm">{role.description}</p>
              <p className="text-foreground/50 mt-2 text-xs">
                {count} {count === 1 ? "employee" : "employees"}
              </p>

              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {role.permissions.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <Check className="text-success mt-0.5 size-4 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
