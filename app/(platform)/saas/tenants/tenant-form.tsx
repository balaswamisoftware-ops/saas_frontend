"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FormPage,
  FormField,
  SelectField,
  toast,
} from "@/components/ui";
import { tenantsApi } from "@/lib/api/services";
import type { Tenant } from "@/types";

const countryOptions = [
  { id: "IN", label: "India" },
  { id: "US", label: "United States" },
  { id: "GB", label: "United Kingdom" },
  { id: "AE", label: "United Arab Emirates" },
];

const LIST_HREF = "/saas/tenants";

/** Turn an organisation name into a URL-safe slug. */
function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function draftFromTenant(t?: Tenant) {
  return {
    name: t?.name ?? "",
    slug: t?.slug ?? "",
    ownerEmail: t?.ownerEmail ?? "",
    country: t?.country ?? "IN",
    seats: t ? String(t.seats) : "5",
  };
}

export interface TenantFormProps {
  /** The tenant being edited, or undefined when creating a new one. */
  tenant?: Tenant;
}

export function TenantForm({ tenant }: TenantFormProps) {
  const router = useRouter();
  const isEdit = Boolean(tenant);
  const [draft, setDraft] = useState(() => draftFromTenant(tenant));
  // Once the admin edits the slug by hand, stop auto-deriving it from the name.
  const [slugTouched, setSlugTouched] = useState(isEdit);

  function onNameChange(v: string) {
    setDraft((d) => ({ ...d, name: v, slug: slugTouched ? d.slug : slugify(v) }));
  }

  function onSlugChange(v: string) {
    setSlugTouched(true);
    setDraft((d) => ({ ...d, slug: slugify(v) }));
  }

  async function save() {
    if (!draft.name.trim() || !draft.ownerEmail.trim()) {
      toast.danger("Name and owner email are required");
      throw new Error("validation");
    }
    if (!draft.slug.trim()) {
      toast.danger("A login slug is required");
      throw new Error("validation");
    }

    try {
      if (isEdit && tenant) {
        await tenantsApi.update(tenant.id, {
          name: draft.name.trim(),
          slug: draft.slug.trim(),
          ownerEmail: draft.ownerEmail.trim(),
          country: draft.country,
          seats: Number(draft.seats) || 0,
        });
        toast.success(`${draft.name.trim()} updated`);
      } else {
        const res = await tenantsApi.createWithOwner({
          name: draft.name.trim(),
          ownerEmail: draft.ownerEmail.trim(),
          country: draft.country,
        });
        toast.success(
          `Owner: ${res.owner.email} · temp password ${res.owner.temporaryPassword} · PIN ${res.owner.pin}`,
        );
      }
      router.push(LIST_HREF);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save tenant";
      toast.danger(message);
      throw err;
    }
  }

  return (
    <FormPage
      title={isEdit ? `Edit ${tenant?.name}` : "New tenant"}
      description={
        isEdit
          ? "Update this organisation's details."
          : "Create a new organisation on the platform."
      }
      backHref={LIST_HREF}
      backLabel="Back to tenants"
      submitLabel={isEdit ? "Save changes" : "Create tenant"}
      onSubmit={save}
    >
      <FormField
        label="Organisation name"
        value={draft.name}
        onChange={onNameChange}
        placeholder="Shanti Ashram"
        isRequired
      />

      <div className="space-y-1.5">
        <FormField
          label="Login slug"
          value={draft.slug}
          onChange={onSlugChange}
          placeholder="shanti-ashram"
          description="Used in the tenant's own login URL. Lowercase letters, numbers and dashes."
          isRequired
        />
        <p className="text-foreground/55 text-xs">
          Tenant staff will sign in at{" "}
          <span className="text-foreground font-mono">
            /admin/{draft.slug || "your-slug"}/login
          </span>
        </p>
      </div>

      <FormField
        label="Owner email"
        type="email"
        value={draft.ownerEmail}
        onChange={(v) => setDraft((d) => ({ ...d, ownerEmail: v }))}
        placeholder="owner@organisation.org"
        isRequired
      />
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Country"
          options={countryOptions}
          selectedKey={draft.country}
          onSelectionChange={(k) => setDraft((d) => ({ ...d, country: String(k ?? "IN") }))}
        />
        <FormField
          label="Employees allowed"
          type="number"
          value={draft.seats}
          onChange={(v) => setDraft((d) => ({ ...d, seats: v }))}
        />
      </div>
    </FormPage>
  );
}
