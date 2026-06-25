"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { Button, FormField, PhoneField, SectionCard, toast } from "@/components/ui";
import { LogoUpload } from "@/components/common/logo-upload";
import { useTenant, useApi } from "@/hooks";
import { toApiPhone, toNationalPhone } from "@/lib/phone";
import type { TenantSettings } from "@/lib/api/services";

export interface SettingsFormProps {
  /** Tweaks copy for the platform console vs a tenant workspace. */
  scope: "platform" | "tenant";
}

type Values = Partial<TenantSettings>;

/**
 * Organisation settings for the tenant workspace. Loads the tenant's profile
 * from the API, is read-only until "Edit", and persists changes on save.
 * (The platform console reuses the layout with static product info.)
 */
export function SettingsForm({ scope }: SettingsFormProps) {
  const isPlatform = scope === "platform";
  const { api } = useTenant();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Values>({ currency: "INR", timezone: "Asia/Kolkata" });

  const { data, loading, refetch } = useApi(
    () => api.settings.get(),
    [],
    !isPlatform, // only the tenant workspace has a settings API
  );

  // Sync fetched settings into the editable form (when not mid-edit).
  useEffect(() => {
    if (data && !editing) setValues(data);
  }, [data, editing]);

  const ro = !editing || isPlatform;
  const set = (key: keyof Values) => (v: string) => setValues((s) => ({ ...s, [key]: v }));
  const field = (key: keyof Values) => (values[key] ?? "") as string;

  async function save() {
    if (isPlatform) {
      setEditing(false);
      toast.success("Settings saved");
      return;
    }
    if (!values.name?.trim()) {
      toast.danger("Organisation name is required");
      return;
    }
    setSaving(true);
    try {
      await api.settings.update(values);
      toast.success("Settings saved");
      setEditing(false);
      refetch();
    } catch (err) {
      toast.danger((err as { message?: string }).message ?? "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setEditing(false);
    if (data) setValues(data);
  }

  /** Upload the chosen logo to S3 via a backend presigned URL; returns its URL. */
  async function uploadLogo(file: File): Promise<string> {
    const { uploadUrl, fileUrl } = await api.settings.logoUploadUrl({
      fileName: file.name,
      contentType: file.type,
    });
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) throw new Error("Could not upload to storage");
    return fileUrl;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        {editing ? (
          <>
            <Button variant="outline" onPress={cancel} isDisabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onPress={save} isDisabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </>
        ) : (
          <Button variant="primary" onPress={() => setEditing(true)} isDisabled={loading}>
            <Pencil className="size-4" /> Edit
          </Button>
        )}
      </div>

      <SectionCard
        title={isPlatform ? "Platform profile" : "Organisation profile"}
        description="Basic information shown across the workspace."
      >
        {!isPlatform ? (
          <div className="mb-5 max-w-3xl">
            <p className="mb-1.5 text-sm font-medium">Organisation logo</p>
            <LogoUpload
              value={field("logoUrl")}
              onChange={set("logoUrl")}
              upload={uploadLogo}
              isDisabled={ro}
            />
          </div>
        ) : null}
        <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
          <FormField
            label={isPlatform ? "Product name" : "Organisation name"}
            value={isPlatform ? "Seva CRM" : field("name")}
            onChange={set("name")}
            isRequired
            isDisabled={ro}
          />
          <FormField
            label="Legal / registered name"
            value={field("legalName")}
            onChange={set("legalName")}
            isDisabled={ro}
          />
        </div>
      </SectionCard>

      <SectionCard title="Contact" description="How devotees and authorities can reach you.">
        <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
          <FormField label="Support email" type="email" value={field("supportEmail")} onChange={set("supportEmail")} isRequired isDisabled={ro} />
          <FormField label="Website" type="url" value={field("website")} onChange={set("website")} isDisabled={ro} />
          <PhoneField label="Phone number" value={toNationalPhone(field("phone"))} onChange={(v) => set("phone")(toApiPhone(v))} isRequired isDisabled={ro} />
          <PhoneField label="Alternate phone" value={toNationalPhone(field("altPhone"))} onChange={(v) => set("altPhone")(toApiPhone(v))} isDisabled={ro} />
        </div>
      </SectionCard>

      <SectionCard title="Address" description="Registered address printed on receipts.">
        <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
          <FormField label="Address line 1" value={field("addressLine1")} onChange={set("addressLine1")} className="sm:col-span-2" isDisabled={ro} />
          <FormField label="Address line 2" value={field("addressLine2")} onChange={set("addressLine2")} className="sm:col-span-2" isDisabled={ro} />
          <FormField label="City" value={field("city")} onChange={set("city")} isDisabled={ro} />
          <FormField label="State" value={field("state")} onChange={set("state")} isDisabled={ro} />
          <FormField label="Pincode" value={field("pincode")} onChange={set("pincode")} isDisabled={ro} />
          <FormField label="Country" value={field("country")} onChange={set("country")} isDisabled={ro} />
        </div>
      </SectionCard>

      <SectionCard
        title="Tax & registration"
        description="Statutory identifiers shown on donation receipts and 80G certificates."
      >
        <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
          <FormField label="GSTIN" value={field("gstin")} onChange={set("gstin")} placeholder="36ABCDE1234F1Z5" isDisabled={ro} />
          <FormField label="PAN" value={field("pan")} onChange={set("pan")} placeholder="ABCDE1234F" isDisabled={ro} />
          <FormField label="80G registration no." value={field("reg80g")} onChange={set("reg80g")} placeholder="For tax-exempt donations" isDisabled={ro} />
          <FormField label="12A registration no." value={field("reg12a")} onChange={set("reg12a")} placeholder="Trust tax registration" isDisabled={ro} />
          <FormField
            label="Trust / society registration no."
            value={field("trustRegNo")}
            onChange={set("trustRegNo")}
            placeholder="Registration certificate number"
            className="sm:col-span-2"
            isDisabled={ro}
          />
        </div>
      </SectionCard>

      <SectionCard title="Preferences" description="Defaults applied across the workspace.">
        <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
          <FormField label="Default currency" value={field("currency")} onChange={set("currency")} isDisabled={ro} />
          <FormField label="Timezone" value={field("timezone")} onChange={set("timezone")} isDisabled={ro} />
        </div>
      </SectionCard>
    </div>
  );
}
