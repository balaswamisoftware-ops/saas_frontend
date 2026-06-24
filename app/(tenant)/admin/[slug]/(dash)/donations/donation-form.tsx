"use client";
import { useAdminPath } from "@/lib/use-admin-path";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserRound, HandCoins, Receipt } from "lucide-react";
import { TextField, Label, TextArea } from "@heroui/react";
import {
  Button,
  PageHeader,
  SectionCard,
  SelectField,
  FormField,
  PhoneField,
  CheckOption,
  toast,
} from "@/components/ui";
import { Country, State, City } from "country-state-city";
import { useTenant, useApi } from "@/hooks";
import type { Donation, DonationMethod } from "@/types";
import { formatCurrency } from "@/lib/format";
import { toApiPhone, toNationalPhone } from "@/lib/phone";

const LIST_SUB = "/donations";
const DEFAULT_COUNTRY = "IN"; // India

const countryOptions = Country.getAllCountries().map((c) => ({ id: c.isoCode, label: c.name }));

const QUICK_AMOUNTS = [101, 251, 501, 1001, 2501, 5001, 11000, 21000];

const PAYMENT_MODES = [
  { id: "cash", label: "Cash" },
  { id: "upi", label: "UPI" },
  { id: "card", label: "Card" },
  { id: "other", label: "Other" },
] as const;

type PaymentMode = (typeof PAYMENT_MODES)[number]["id"];

/** Map the stored donation method back onto the counter payment buttons. */
const METHOD_TO_PAYMENT: Record<DonationMethod, PaymentMode> = {
  cash: "cash",
  upi: "upi",
  card: "card",
  bank: "other",
  cheque: "other",
};

/** Map a counter payment button back onto a stored donation method. */
const PAYMENT_TO_METHOD: Record<PaymentMode, DonationMethod> = {
  cash: "cash",
  upi: "upi",
  card: "card",
  other: "bank",
};

function countryCodeFromName(name?: string) {
  return Country.getAllCountries().find((c) => c.name === name)?.isoCode ?? DEFAULT_COUNTRY;
}
function stateCodeFromName(countryCode: string, name?: string) {
  return State.getStatesOfCountry(countryCode).find((s) => s.name === name)?.isoCode ?? "";
}

function draftFromDonation(d?: Donation) {
  const countryCode = countryCodeFromName(d?.country);
  return {
    eventName: d?.eventName ?? "",
    purpose: d?.purpose ?? "",
    anonymous: d?.anonymous ?? false,
    devoteeName: d?.devoteeName ?? "",
    mobile: toNationalPhone(d?.mobile),
    email: d?.email ?? "",
    address: d?.address ?? "",
    countryCode,
    stateCode: d ? stateCodeFromName(countryCode, d.state) : "",
    city: d?.city ?? "",
    pincode: d?.pincode ?? "",
    gotra: d?.gotra ?? "",
    nakshatra: d?.nakshatra ?? "",
    pan: d?.pan ?? "",
    amount: d ? String(d.amount) : "",
    payment: (d ? METHOD_TO_PAYMENT[d.method] : "cash") as PaymentMode,
    issue80g: d?.issue80g ?? true,
    notes: d?.notes ?? "",
  };
}

export interface DonationFormProps {
  /** The donation being edited, or undefined when creating a new one. */
  donation?: Donation;
  /** Hide the back link — used by the standalone "New Donation" page. */
  hideBack?: boolean;
}

export function DonationForm({ donation, hideBack }: DonationFormProps) {
  const router = useRouter();
  const adminPath = useAdminPath();
  const { api } = useTenant();
  const isEdit = Boolean(donation);
  const [draft, setDraft] = useState(() => draftFromDonation(donation));

  const purposesQuery = useApi(() => api.donationPurposes.list(), []);
  const activePurposes = (purposesQuery.data?.items ?? []).filter((p) => p.active);
  const purposeOptions = activePurposes.map((p) => ({ id: p.name, label: p.name }));

  // State / city dropdowns cascade from the selected country / state.
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

  const amountValue = Number(draft.amount) || 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.anonymous && !draft.devoteeName.trim()) {
      toast.danger("Donor name is required (or mark the donation anonymous)");
      return;
    }
    if (amountValue <= 0) {
      toast.danger("Enter a valid donation amount");
      return;
    }

    const countryName = Country.getCountryByCode(draft.countryCode)?.name;
    const stateName = draft.stateCode
      ? State.getStateByCodeAndCountry(draft.stateCode, draft.countryCode)?.name
      : undefined;

    const payload: Partial<Donation> = {
      devoteeName: draft.anonymous ? "Anonymous" : draft.devoteeName.trim(),
      amount: amountValue,
      currency: donation?.currency ?? "INR",
      method: PAYMENT_TO_METHOD[draft.payment],
      purpose: draft.purpose,
      receiptNo: donation?.receiptNo,
      date: donation?.date,
      eventName: draft.eventName || undefined,
      anonymous: draft.anonymous,
      mobile: toApiPhone(draft.mobile) || undefined,
      email: draft.email || undefined,
      address: draft.address || undefined,
      city: draft.city || undefined,
      state: stateName,
      country: countryName,
      pincode: draft.pincode || undefined,
      pan: draft.pan || undefined,
      gotra: draft.gotra || undefined,
      nakshatra: draft.nakshatra || undefined,
      issue80g: draft.issue80g,
      notes: draft.notes || undefined,
    };

    try {
      if (isEdit && donation) {
        await api.donations.update(donation.id, payload);
      } else {
        await api.donations.create(payload);
      }
    } catch (err) {
      toast.danger("Could not save the donation. Please try again.");
      throw err;
    }

    const who = draft.anonymous ? "Anonymous" : draft.devoteeName.trim();
    toast.success(
      isEdit
        ? "Donation updated"
        : `${formatCurrency(amountValue)} received from ${who}${draft.issue80g ? " · 80G receipt issued" : ""}`,
    );
    router.push(adminPath(LIST_SUB));
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit donation" : "Donations"}
        description="Record donations and issue 80G receipts."
        eyebrow={
          hideBack ? undefined : (
            <Link
              href={adminPath(LIST_SUB)}
              className="text-foreground/55 hover:text-foreground inline-flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="size-4" /> Back to donations
            </Link>
          )
        }
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left: donor details */}
        <div className="lg:col-span-7">
          <SectionCard
            title={
              <span className="flex items-center gap-2">
                <UserRound className="size-4" /> Donor Details
              </span>
            }
          >
            <div className="space-y-4">
              <SelectField
                label="Purpose"
                placeholder="Select purpose"
                options={purposeOptions}
                selectedKey={draft.purpose || null}
                onSelectionChange={(k) => {
                  const purpose = String(k ?? "");
                  const preset = activePurposes.find((p) => p.name === purpose)?.suggestedAmount;
                  setDraft((d) => ({
                    ...d,
                    purpose,
                    amount: preset && amountValue <= 0 ? String(preset) : d.amount,
                  }));
                }}
              />

              <CheckOption
                label="Anonymous donation"
                isSelected={draft.anonymous}
                onChange={(v) => setDraft((d) => ({ ...d, anonymous: v }))}
              />

              <FormField
                label="Devotee Name"
                value={draft.devoteeName}
                onChange={(v) => setDraft((d) => ({ ...d, devoteeName: v }))}
                placeholder="Full name"
                isRequired={!draft.anonymous}
                isDisabled={draft.anonymous}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PhoneField label="Mobile" value={draft.mobile} onChange={(v) => setDraft((d) => ({ ...d, mobile: v }))} isDisabled={draft.anonymous} />
                <FormField label="Email" type="email" value={draft.email} onChange={(v) => setDraft((d) => ({ ...d, email: v }))} isDisabled={draft.anonymous} />
              </div>

              <FormField
                label="Address (for 80G certificate)"
                value={draft.address}
                onChange={(v) => setDraft((d) => ({ ...d, address: v }))}
                placeholder="House no, street, area"
                isDisabled={draft.anonymous}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField
                  label="Country"
                  options={countryOptions}
                  selectedKey={draft.countryCode}
                  isDisabled={draft.anonymous}
                  onSelectionChange={(k) =>
                    setDraft((d) => ({ ...d, countryCode: String(k ?? DEFAULT_COUNTRY), stateCode: "", city: "" }))
                  }
                />
                <SelectField
                  label="State"
                  placeholder={stateOptions.length ? "Select…" : "No states listed"}
                  options={stateOptions}
                  selectedKey={draft.stateCode || null}
                  isDisabled={draft.anonymous || !stateOptions.length}
                  onSelectionChange={(k) => setDraft((d) => ({ ...d, stateCode: String(k ?? ""), city: "" }))}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {cityOptions.length ? (
                  <SelectField
                    label="City"
                    options={cityOptions}
                    selectedKey={draft.city || null}
                    isDisabled={draft.anonymous}
                    onSelectionChange={(k) => setDraft((d) => ({ ...d, city: String(k ?? "") }))}
                  />
                ) : (
                  <FormField label="City" value={draft.city} onChange={(v) => setDraft((d) => ({ ...d, city: v }))} isDisabled={draft.anonymous} />
                )}
                <FormField label="PIN code" value={draft.pincode} onChange={(v) => setDraft((d) => ({ ...d, pincode: v }))} placeholder="500001" isDisabled={draft.anonymous} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Gotra" value={draft.gotra} onChange={(v) => setDraft((d) => ({ ...d, gotra: v }))} placeholder="e.g. Kashyapa" isDisabled={draft.anonymous} />
                <FormField label="Nakshatra" value={draft.nakshatra} onChange={(v) => setDraft((d) => ({ ...d, nakshatra: v }))} placeholder="e.g. Rohini" isDisabled={draft.anonymous} />
              </div>

              <FormField
                label="PAN"
                value={draft.pan}
                onChange={(v) => setDraft((d) => ({ ...d, pan: v.toUpperCase() }))}
                placeholder="ABCDE1234F"
                isDisabled={draft.anonymous}
              />
            </div>
          </SectionCard>
        </div>

        {/* Right: amount + payment */}
        <div className="lg:col-span-5">
          <SectionCard
            title={
              <span className="flex items-center gap-2">
                <HandCoins className="size-4" /> Donation Amount
              </span>
            }
          >
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {QUICK_AMOUNTS.map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant={amountValue === amt ? "primary" : "outline"}
                    size="sm"
                    onPress={() => setDraft((d) => ({ ...d, amount: String(amt) }))}
                  >
                    {formatCurrency(amt)}
                  </Button>
                ))}
              </div>

              <FormField
                label="Amount (₹)"
                type="number"
                value={draft.amount}
                onChange={(v) => setDraft((d) => ({ ...d, amount: v }))}
                isRequired
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Payment Mode</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {PAYMENT_MODES.map((m) => (
                    <Button
                      key={m.id}
                      type="button"
                      variant={draft.payment === m.id ? "primary" : "outline"}
                      size="sm"
                      onPress={() => setDraft((d) => ({ ...d, payment: m.id }))}
                    >
                      {m.label}
                    </Button>
                  ))}
                </div>
              </div>

              <CheckOption
                label="Issue 80G tax-exempt receipt"
                isSelected={draft.issue80g}
                onChange={(v) => setDraft((d) => ({ ...d, issue80g: v }))}
              />

              <TextField
                className="flex flex-col gap-1.5"
                value={draft.notes}
                onChange={(v) => setDraft((d) => ({ ...d, notes: v }))}
              >
                <Label>Notes (internal)</Label>
                <TextArea placeholder="Notes about this donation" rows={3} />
              </TextField>

              <Button type="submit" variant="primary" className="w-full">
                <Receipt className="size-4" />
                {isEdit ? "Save changes" : `Receive Donation — ${formatCurrency(amountValue)}`}
              </Button>
            </div>
          </SectionCard>
        </div>
      </form>
    </div>
  );
}
