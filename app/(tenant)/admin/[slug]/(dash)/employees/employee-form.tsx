"use client";
import { useAdminPath } from "@/lib/use-admin-path";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  Button,
  FormPage,
  FormField,
  PhoneField,
  SelectField,
  toast,
} from "@/components/ui";
import type { Gender, Status, User } from "@/types";
import { useTenant, useApi } from "@/hooks";
import { toApiPhone, toNationalPhone } from "@/lib/phone";

const statusOptions = [
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
];

const genderOptions = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "other", label: "Other" },
];

const LIST_SUB = "/employees";

/** Generate a random 6-digit PIN (uniqueness is enforced by the operator). */
function freshPin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function draftFromUser(u?: User) {
  return {
    name: u?.name ?? "",
    email: u?.email ?? "",
    phone: toNationalPhone(u?.phone),
    altPhone: toNationalPhone(u?.altPhone),
    dob: u?.dob ?? "",
    gender: (u?.gender ?? "") as Gender | "",
    roleId: u?.roleId ?? "",
    status: (u?.status ?? "active") as Status,
    pin: u?.pin ?? "",
  };
}

export interface EmployeeFormProps {
  /** The employee being edited, or undefined when adding a new one. */
  user?: User;
}

export function EmployeeForm({ user }: EmployeeFormProps) {
  const adminPath = useAdminPath();
  const { api } = useTenant();
  const isEdit = Boolean(user);
  const [draft, setDraft] = useState(() => draftFromUser(user));

  // Roles this organisation offers — drives the role dropdown (id → name).
  const { data: rolesData } = useApi(() => api.roles.list({ limit: 100 }), []);
  const roleOptions = useMemo(
    () => (rolesData?.items ?? []).map((r) => ({ id: r.id, label: r.name })),
    [rolesData],
  );

  // Default the role to the first available one when creating.
  useEffect(() => {
    if (!user && !draft.roleId && roleOptions.length) {
      setDraft((d) => ({ ...d, roleId: roleOptions[0].id }));
    }
  }, [user, draft.roleId, roleOptions]);

  // Generate the PIN after mount (not during render) so SSR/client markup match.
  useEffect(() => {
    if (!user) setDraft((d) => (d.pin ? d : { ...d, pin: freshPin() }));
  }, [user]);

  async function save() {
    if (!draft.name.trim() || !draft.email.trim()) {
      toast.danger("Name and email are required");
      throw new Error("validation");
    }
    if (!draft.roleId) {
      toast.danger("Select a role");
      throw new Error("validation");
    }
    if (!/^\d{6}$/.test(draft.pin)) {
      toast.danger("PIN must be exactly 6 digits");
      throw new Error("validation");
    }

    const payload = {
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: toApiPhone(draft.phone) || undefined,
      altPhone: toApiPhone(draft.altPhone) || undefined,
      dob: draft.dob || undefined,
      gender: draft.gender || undefined,
      roleId: draft.roleId,
      status: draft.status,
      pin: draft.pin,
    };

    try {
      if (isEdit && user) {
        await api.employees.update(user.id, payload);
      } else {
        await api.employees.create(payload);
      }
    } catch (err) {
      toast.danger((err as { message?: string }).message ?? "Could not save employee");
      throw err;
    }
    toast.success(isEdit ? `${payload.name} updated` : `${payload.name} invited`);
  }

  return (
    <FormPage
      title={isEdit ? "Edit employee" : "Add employee"}
      description={
        isEdit
          ? user?.name || user?.email
          : "Invite a person to your organisation and assign their role."
      }
      backHref={adminPath(LIST_SUB)}
      backLabel="Back to employees"
      submitLabel={isEdit ? "Save changes" : "Send invite"}
      onSubmit={save}
    >
      <FormField label="Full name" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} isRequired />
      <FormField label="Email" type="email" value={draft.email} onChange={(v) => setDraft((d) => ({ ...d, email: v }))} isRequired />
      <div className="grid grid-cols-2 gap-4">
        <PhoneField label="Primary phone" value={draft.phone} onChange={(v) => setDraft((d) => ({ ...d, phone: v }))} />
        <PhoneField label="Secondary phone" value={draft.altPhone} onChange={(v) => setDraft((d) => ({ ...d, altPhone: v }))} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Date of birth" type="date" value={draft.dob} onChange={(v) => setDraft((d) => ({ ...d, dob: v }))} />
        <SelectField
          label="Gender"
          placeholder="Select…"
          options={genderOptions}
          selectedKey={draft.gender || null}
          onSelectionChange={(k) => setDraft((d) => ({ ...d, gender: String(k ?? "") as Gender | "" }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Role"
          placeholder={roleOptions.length ? "Select…" : "Loading roles…"}
          options={roleOptions}
          selectedKey={draft.roleId || null}
          onSelectionChange={(k) => setDraft((d) => ({ ...d, roleId: String(k ?? "") }))}
        />
        <SelectField
          label="Status"
          options={statusOptions}
          selectedKey={draft.status}
          onSelectionChange={(k) => setDraft((d) => ({ ...d, status: String(k ?? "active") as Status }))}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-end gap-2">
          <FormField
            className="flex-1"
            label="Login PIN"
            value={draft.pin}
            onChange={(v) => setDraft((d) => ({ ...d, pin: v.replace(/\D/g, "").slice(0, 6) }))}
            placeholder="6-digit PIN"
            isRequired
          />
          <Button variant="outline" onPress={() => setDraft((d) => ({ ...d, pin: freshPin() }))}>
            <RefreshCw className="size-4" /> Generate
          </Button>
        </div>
        <p className="text-foreground/55 text-xs">
          Unique 6-digit PIN this employee uses to sign in at the counter / POS.
        </p>
      </div>
    </FormPage>
  );
}
