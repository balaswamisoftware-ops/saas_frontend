"use client";
import { useAdminPath } from "@/lib/use-admin-path";

import { useMemo, useState } from "react";
import {
  FormPage,
  FormField,
  CheckboxGroup,
  CheckOption,
  toast,
} from "@/components/ui";
import { useTenant, useApi } from "@/hooks";
import { humanize } from "@/lib/utils";

const LIST_SUB = "/roles";

/**
 * Create a tenant role. Permissions are presented module-by-module — selecting
 * a module grants full control of it (`<module>:*`), matching the backend's
 * wildcard RBAC.
 */
export function RoleForm() {
  const adminPath = useAdminPath();
  const { api } = useTenant();
  const { data: catalog } = useApi(() => api.roles.catalog(), []);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);

  // One option per module, granting `<module>:*`.
  const moduleOptions = useMemo(
    () =>
      (catalog?.modules ?? []).map((m) => ({
        value: `${m.key}:*`,
        label: `Manage ${humanize(m.key)}`,
      })),
    [catalog],
  );

  async function createRole() {
    if (!name.trim()) {
      toast.danger("Role name is required");
      throw new Error("validation");
    }
    if (permissions.length === 0) {
      toast.danger("Select at least one permission");
      throw new Error("validation");
    }
    try {
      await api.roles.create({
        name: name.trim(),
        description: description.trim() || undefined,
        permissions,
      });
    } catch (err) {
      toast.danger((err as { message?: string }).message ?? "Could not create role");
      throw err;
    }
    toast.success(`${name.trim()} role created`);
  }

  return (
    <FormPage
      title="New role"
      description="Name the role and choose exactly what it can do."
      backHref={adminPath(LIST_SUB)}
      backLabel="Back to roles"
      submitLabel="Create role"
      onSubmit={createRole}
    >
      <FormField
        label="Role name"
        value={name}
        onChange={setName}
        placeholder="e.g. Front Desk"
        isRequired
      />
      <FormField
        label="Description"
        value={description}
        onChange={setDescription}
        placeholder="One line on what this role is responsible for"
      />

      <div className="space-y-2">
        <p className="text-sm font-medium">Permissions</p>
        <CheckboxGroup
          aria-label="Permissions"
          value={permissions}
          onChange={setPermissions}
          className="gap-3"
        >
          {moduleOptions.map((opt) => (
            <CheckOption key={opt.value} value={opt.value} label={opt.label} />
          ))}
        </CheckboxGroup>
      </div>
    </FormPage>
  );
}
