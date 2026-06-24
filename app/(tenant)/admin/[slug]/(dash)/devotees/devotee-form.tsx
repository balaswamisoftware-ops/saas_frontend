"use client";
import { useAdminPath } from "@/lib/use-admin-path";

import { useMemo, useState } from "react";
import {
  FormPage,
  FormField,
  PhoneField,
  SelectField,
  toast,
} from "@/components/ui";
import { Country, State, City } from "country-state-city";
import { useTenant } from "@/hooks";
import { toApiPhone, toNationalPhone } from "@/lib/phone";
import type { Devotee } from "@/types";

const DEFAULT_COUNTRY = "IN"; // India

const countryOptions = Country.getAllCountries().map((c) => ({ id: c.isoCode, label: c.name }));

/** Look up a country/state ISO code from a stored display name (for editing existing devotees). */
function countryCodeFromName(name?: string) {
  return Country.getAllCountries().find((c) => c.name === name)?.isoCode ?? DEFAULT_COUNTRY;
}
function stateCodeFromName(countryCode: string, name?: string) {
  return State.getStatesOfCountry(countryCode).find((s) => s.name === name)?.isoCode ?? "";
}

const genderOptions = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "other", label: "Other" },
];

const LIST_SUB = "/devotees";

function draftFromDevotee(d?: Devotee) {
  const countryCode = countryCodeFromName(d?.country);
  return {
    name: d?.name ?? "",
    email: d?.email ?? "",
    gender: d?.gender ?? "",
    phone: toNationalPhone(d?.phone),
    altPhone: toNationalPhone(d?.altPhone),
    aadhaar: d?.aadhaar ?? "",
    address: d?.address ?? "",
    countryCode,
    stateCode: d ? stateCodeFromName(countryCode, d.state) : "",
    city: d?.city ?? "",
    pincode: d?.pincode ?? "",
    gotra: d?.gotra ?? "",
    nakshatra: d?.nakshatra ?? "",
  };
}

export interface DevoteeFormProps {
  /** The devotee being edited, or undefined when creating a new one. */
  devotee?: Devotee;
}

export function DevoteeForm({ devotee }: DevoteeFormProps) {
  const adminPath = useAdminPath();
  const { api } = useTenant();
  const isEdit = Boolean(devotee);
  const [draft, setDraft] = useState(() => draftFromDevotee(devotee));

  // State/city dropdowns cascade from the selected country/state.
  const stateOptions = useMemo(
    () => State.getStatesOfCountry(draft.countryCode).map((s) => ({ id: s.isoCode, label: s.name })),
    [draft.countryCode],
  );
  const cityOptions = useMemo(
    () =>
      draft.stateCode
        ? City.getCitiesOfState(draft.countryCode, draft.stateCode).map((c) => ({ id: c.name, label: c.name }))
        : [],
    [draft.countryCode, draft.stateCode],
  );

  async function save() {
    if (draft.phone.length !== 10) {
      toast.danger("Enter a valid 10-digit phone number");
      throw new Error("validation");
    }
    const displayName = draft.name.trim() || draft.phone;

    const payload: Partial<Devotee> = {
      name: draft.name,
      phone: toApiPhone(draft.phone),
      email: draft.email,
      altPhone: toApiPhone(draft.altPhone),
      aadhaar: draft.aadhaar,
      address: draft.address,
      city: draft.city,
      state: State.getStateByCodeAndCountry(draft.stateCode, draft.countryCode)?.name,
      country: Country.getCountryByCode(draft.countryCode)?.name,
      pincode: draft.pincode,
      gotra: draft.gotra,
      nakshatra: draft.nakshatra,
    };
    if (draft.gender) payload.gender = draft.gender as Devotee["gender"];

    try {
      if (isEdit && devotee) {
        await api.devotees.update(devotee.id, payload);
      } else {
        await api.devotees.create(payload);
      }
    } catch (err) {
      toast.danger((err as { message?: string }).message ?? "Something went wrong");
      throw err;
    }

    toast.success(isEdit ? `${displayName} updated` : `${displayName} added`);
  }

  return (
    <FormPage
      title={isEdit ? "Edit devotee" : "Add devotee"}
      description={isEdit ? devotee?.name || devotee?.phone : "Create a new devotee record."}
      backHref={adminPath(LIST_SUB)}
      backLabel="Back to devotees"
      submitLabel={isEdit ? "Save changes" : "Add devotee"}
      onSubmit={save}
    >
      <div className="grid grid-cols-2 gap-4">
        <PhoneField label="Primary phone" value={draft.phone} onChange={(v) => setDraft((d) => ({ ...d, phone: v }))} isRequired />
        <PhoneField label="Secondary phone" value={draft.altPhone} onChange={(v) => setDraft((d) => ({ ...d, altPhone: v }))} />
      </div>
      <FormField label="Full name" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Email" type="email" value={draft.email} onChange={(v) => setDraft((d) => ({ ...d, email: v }))} />
        <SelectField
          label="Gender"
          placeholder="Select…"
          options={genderOptions}
          selectedKey={draft.gender || null}
          onSelectionChange={(k) => setDraft((d) => ({ ...d, gender: String(k ?? "") }))}
        />
      </div>
      <FormField
        label="Aadhaar number"
        value={draft.aadhaar}
        onChange={(v) => setDraft((d) => ({ ...d, aadhaar: v }))}
        placeholder="1234 5678 9012"
      />
      <FormField
        label="Address"
        value={draft.address}
        onChange={(v) => setDraft((d) => ({ ...d, address: v }))}
        placeholder="House no, street, area"
      />
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Country"
          options={countryOptions}
          selectedKey={draft.countryCode}
          onSelectionChange={(k) =>
            setDraft((d) => ({ ...d, countryCode: String(k ?? DEFAULT_COUNTRY), stateCode: "", city: "" }))
          }
        />
        <SelectField
          label="State"
          placeholder={stateOptions.length ? "Select…" : "No states listed"}
          options={stateOptions}
          selectedKey={draft.stateCode || null}
          isDisabled={!stateOptions.length}
          onSelectionChange={(k) => setDraft((d) => ({ ...d, stateCode: String(k ?? ""), city: "" }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {cityOptions.length ? (
          <SelectField
            label="City"
            options={cityOptions}
            selectedKey={draft.city || null}
            onSelectionChange={(k) => setDraft((d) => ({ ...d, city: String(k ?? "") }))}
          />
        ) : (
          <FormField label="City" value={draft.city} onChange={(v) => setDraft((d) => ({ ...d, city: v }))} />
        )}
        <FormField label="PIN code" value={draft.pincode} onChange={(v) => setDraft((d) => ({ ...d, pincode: v }))} placeholder="500001" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Gotra" value={draft.gotra} onChange={(v) => setDraft((d) => ({ ...d, gotra: v }))} placeholder="e.g. Kashyapa" />
        <FormField label="Nakshatra" value={draft.nakshatra} onChange={(v) => setDraft((d) => ({ ...d, nakshatra: v }))} placeholder="e.g. Rohini" />
      </div>
    </FormPage>
  );
}
