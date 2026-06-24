"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FormPage,
  FormField,
  SelectField,
  Button,
  toast,
} from "@/components/ui";
import { useApi } from "@/hooks";
import { platformApi } from "@/lib/api/services";

const emptyDraft = { name: "", email: "", roleId: "", password: "" };

const LIST_HREF = "/saas/employees";

/** Generate a readable temporary password the admin can share. */
function generatePassword() {
  const words = ["seva", "lotus", "ganga", "surya", "veda", "kamal"];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${w[0].toUpperCase()}${w.slice(1)}@${n}`;
}

export function EmployeeForm() {
  const router = useRouter();
  const [draft, setDraft] = useState(emptyDraft);

  // Platform roles drive the role dropdown.
  const { data: rolesData } = useApi(() => platformApi.roles.list({ limit: 100 }), []);
  const roleOptions = useMemo(
    () => (rolesData?.items ?? []).map((r) => ({ id: r.id, label: r.name })),
    [rolesData],
  );
  useEffect(() => {
    if (!draft.roleId && roleOptions.length) {
      setDraft((d) => ({ ...d, roleId: roleOptions[0].id }));
    }
  }, [draft.roleId, roleOptions]);

  async function createEmployee() {
    if (!draft.name.trim() || !draft.email.trim()) {
      toast.danger("Name and email are required");
      throw new Error("validation");
    }
    if (!draft.roleId) {
      toast.danger("Select a role");
      throw new Error("validation");
    }
    if (!draft.password.trim()) {
      toast.danger("Set a login password for the employee");
      throw new Error("validation");
    }
    try {
      await platformApi.employees.create({
        name: draft.name.trim(),
        email: draft.email.trim(),
        roleId: draft.roleId,
        password: draft.password,
      } as Parameters<typeof platformApi.employees.create>[0]);
    } catch (err) {
      toast.danger((err as { message?: string }).message ?? "Could not add employee");
      throw err;
    }
    toast.success(`${draft.name.trim()} added`);
    router.push(LIST_HREF);
  }

  return (
    <FormPage
      title="Add employee"
      description="They will receive an invite to sign in to the platform console."
      backHref={LIST_HREF}
      backLabel="Back to employees"
      submitLabel="Add employee"
      onSubmit={createEmployee}
    >
      <FormField
        label="Full name"
        value={draft.name}
        onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
        placeholder="Jane Doe"
        isRequired
      />
      <FormField
        label="Work email"
        type="email"
        value={draft.email}
        onChange={(v) => setDraft((d) => ({ ...d, email: v }))}
        placeholder="jane@sevacrm.app"
        isRequired
      />
      <SelectField
        label="Role"
        placeholder={roleOptions.length ? "Select…" : "Loading roles…"}
        options={roleOptions}
        selectedKey={draft.roleId || null}
        onSelectionChange={(k) => setDraft((d) => ({ ...d, roleId: String(k ?? "") }))}
      />

      <div className="space-y-1.5">
        <div className="flex items-end gap-2">
          <FormField
            label="Login password"
            value={draft.password}
            onChange={(v) => setDraft((d) => ({ ...d, password: v }))}
            placeholder="Set a password"
            description="Shared with the employee to sign in. Visible only to platform admins."
            isRequired
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onPress={() => setDraft((d) => ({ ...d, password: generatePassword() }))}
          >
            Generate
          </Button>
        </div>
      </div>
    </FormPage>
  );
}
