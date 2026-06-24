"use client";

import { useState } from "react";
import {
  FormPage,
  FormField,
  CheckboxGroup,
  CheckOption,
  toast,
} from "@/components/ui";

/** The permission a role can be granted. `impersonate` controls tenant impersonation. */
const PERMISSIONS = [
  { id: "Manage tenants", hint: "Create, edit and suspend tenants" },
  { id: "Manage employees & roles", hint: "Invite staff and define roles" },
  { id: "Impersonate tenants", hint: "Sign in to a tenant's workspace to help them" },
  { id: "View audit logs", hint: "See the trail of platform events" },
  { id: "View dashboards", hint: "Read-only access to overview & reports" },
] as const;

const IMPERSONATE = "Impersonate tenants";

const LIST_HREF = "/saas/roles";

const emptyDraft = {
  name: "",
  description: "",
  permissions: ["View dashboards"] as string[],
};

export function RoleForm() {
  const [draft, setDraft] = useState(emptyDraft);

  function createRole() {
    if (!draft.name.trim()) {
      toast.danger("Role name is required");
      throw new Error("validation");
    }
    if (draft.permissions.length === 0) {
      toast.danger("Select at least one permission");
      throw new Error("validation");
    }
    // No persistence (mock prototype) — just confirm the action.
    toast.success(`${draft.name.trim()} role created`);
  }

  const willImpersonate = draft.permissions.includes(IMPERSONATE);

  return (
    <FormPage
      title="New role"
      description="Name the role and choose exactly what it can do."
      backHref={LIST_HREF}
      backLabel="Back to roles"
      submitLabel="Create role"
      onSubmit={createRole}
    >
      <FormField
        label="Role name"
        value={draft.name}
        onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
        placeholder="e.g. Support Lead"
        isRequired
      />
      <FormField
        label="Description"
        value={draft.description}
        onChange={(v) => setDraft((d) => ({ ...d, description: v }))}
        placeholder="One line on what this role is responsible for"
      />

      <div className="space-y-2">
        <p className="text-sm font-medium">Permissions</p>
        <CheckboxGroup
          aria-label="Permissions"
          value={draft.permissions}
          onChange={(v) => setDraft((d) => ({ ...d, permissions: v }))}
          className="gap-3"
        >
          {PERMISSIONS.map((perm) => (
            <CheckOption
              key={perm.id}
              value={perm.id}
              label={perm.id}
              description={perm.hint}
            />
          ))}
        </CheckboxGroup>
      </div>

      <div
        className={
          willImpersonate
            ? "bg-success/10 text-success rounded-lg px-3 py-2 text-xs"
            : "bg-default-100 text-foreground/60 rounded-lg px-3 py-2 text-xs"
        }
      >
        {willImpersonate
          ? "Employees with this role will be able to impersonate tenants."
          : "This role will not be able to impersonate tenants."}
      </div>
    </FormPage>
  );
}
