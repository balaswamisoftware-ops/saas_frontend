"use client";

import { useEffect, useState } from "react";
import { Printer as PrinterIcon, RotateCcw, Save } from "lucide-react";
import {
  Button,
  PageHeader,
  SectionCard,
  FormField,
  SwitchOption,
  Chip,
  TextField,
  TextArea,
  Label,
  toast,
} from "@/components/ui";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ScaledReceipt } from "@/components/receipt/scaled-receipt";
import { useTenant, useApi } from "@/hooks";
import {
  DEFAULT_DESIGNS,
  MERGE_TAGS,
  RECEIPT_LAYOUT_LABEL,
  SAMPLE_RECEIPT,
  mergeDesigns,
  printReceipt,
  type ReceiptDesign,
  type ReceiptData,
} from "@/lib/receipt";
import type { ReceiptLayout } from "@/types";

const LAYOUTS: ReceiptLayout[] = ["55mm", "80mm", "a4"];

export default function ReceiptLayoutsPage() {
  const { api } = useTenant();
  const { data: settings, refetch } = useApi(() => api.settings.get(), []);
  const [active, setActive] = useState<ReceiptLayout>("80mm");
  const [designs, setDesigns] = useState<Record<ReceiptLayout, ReceiptDesign>>(DEFAULT_DESIGNS);
  const [saving, setSaving] = useState(false);

  // Hydrate the designer from the tenant's saved layouts once settings load.
  useEffect(() => {
    if (settings) setDesigns(mergeDesigns(settings.receiptLayouts));
  }, [settings]);

  const design = designs[active];

  // Preview with the tenant's real organisation header (sample line items).
  const previewData: ReceiptData = {
    ...SAMPLE_RECEIPT,
    orgName: settings?.name ?? SAMPLE_RECEIPT.orgName,
    addressLines: settings
      ? [settings.addressLine1, [settings.addressLine2, settings.city, settings.state, settings.pincode].filter(Boolean).join(", ")].filter(
          (l): l is string => Boolean(l && l.trim()),
        )
      : SAMPLE_RECEIPT.addressLines,
    phone: settings?.phone ?? SAMPLE_RECEIPT.phone,
    gstin: settings?.gstin ?? SAMPLE_RECEIPT.gstin,
    pan: settings?.pan ?? SAMPLE_RECEIPT.pan,
    reg80g: settings?.reg80g ?? SAMPLE_RECEIPT.reg80g,
  };

  function update(patch: Partial<ReceiptDesign>) {
    setDesigns((prev) => ({ ...prev, [active]: { ...prev[active], ...patch } }));
  }

  async function save() {
    setSaving(true);
    try {
      await api.settings.update({ receiptLayouts: designs });
      toast.success(`${RECEIPT_LAYOUT_LABEL[active]} layout saved`);
      refetch();
    } catch (err) {
      toast.danger((err as { message?: string }).message ?? "Could not save layout");
    } finally {
      setSaving(false);
    }
  }

  function resetActive() {
    update(DEFAULT_DESIGNS[active]);
    toast.success(`${RECEIPT_LAYOUT_LABEL[active]} reset to default`);
  }

  return (
    <div>
      <PageHeader
        title="Receipt Layouts"
        description="Design the header and footer that wrap each receipt. The structural blocks — title, item table and total — stay built-in so totals are always correct."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onPress={resetActive}>
              <RotateCcw className="size-4" /> Reset
            </Button>
            <Button variant="primary" onPress={save} isDisabled={saving}>
              <Save className="size-4" /> {saving ? "Saving…" : "Save layout"}
            </Button>
          </div>
        }
      />

      {/* Layout size switcher */}
      <div className="mb-4 flex flex-wrap gap-2">
        {LAYOUTS.map((l) => (
          <Button
            key={l}
            size="sm"
            variant={active === l ? "primary" : "outline"}
            onPress={() => setActive(l)}
          >
            {RECEIPT_LAYOUT_LABEL[l]}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Designer */}
        <div className="space-y-4 lg:col-span-7">
          <SectionCard title="Header" description="Shown at the top. Use Insert field for live values.">
            <RichTextEditor
              aria-label="Receipt header"
              value={design.headerHtml}
              onChange={(html) => update({ headerHtml: html })}
              mergeTags={[...MERGE_TAGS]}
            />
          </SectionCard>

          <SectionCard title="Body blocks" description="The built-in structural parts of the receipt.">
            <div className="space-y-4">
              <FormField
                label="Title"
                value={design.title}
                onChange={(v) => update({ title: v })}
                placeholder="e.g. DONATION / SEVA RECEIPT"
              />
              <SwitchOption
                label="Receipt details"
                description="Receipt no., date, devotee name and payment mode"
                isSelected={design.showMeta}
                onChange={(v) => update({ showMeta: v })}
              />
              <SwitchOption
                label="Item table"
                description="Particulars, quantity and amount"
                isSelected={design.showItems}
                onChange={(v) => update({ showItems: v })}
              />
              <SwitchOption
                label="Total"
                description="Grand total of all line items"
                isSelected={design.showTotal}
                onChange={(v) => update({ showTotal: v })}
              />
              <SwitchOption
                label="Amount in words"
                description="Spell the total out, e.g. “Rupees Five Thousand only”"
                isSelected={design.showAmountInWords}
                onChange={(v) => update({ showAmountInWords: v })}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Donor receipt (80G)"
            description="Statutory declaration and signature — recommended for A4 receipts donors keep."
          >
            <div className="space-y-4">
              <TextField
                className="flex flex-col gap-1.5"
                value={design.declaration}
                onChange={(v) => update({ declaration: v })}
              >
                <Label>80G / tax declaration</Label>
                <TextArea
                  placeholder="Donations are eligible for deduction under Section 80G…"
                  rows={3}
                />
                <span className="text-foreground/55 text-xs">
                  Supports merge tags. Leave blank to hide.
                </span>
              </TextField>
              <FormField
                label="Signatory line"
                value={design.signatory}
                onChange={(v) => update({ signatory: v })}
                placeholder="e.g. For SriVidya Pitam"
                description="Leave blank to hide the signature block."
              />
            </div>
          </SectionCard>

          <SectionCard title="Footer" description="Shown at the bottom (e.g. blessings, terms).">
            <RichTextEditor
              aria-label="Receipt footer"
              value={design.footerHtml}
              onChange={(html) => update({ footerHtml: html })}
              mergeTags={[...MERGE_TAGS]}
            />
          </SectionCard>

          <SectionCard title="Available fields" description="Insert these anywhere in the header or footer.">
            <div className="flex flex-wrap gap-1.5">
              {MERGE_TAGS.map((t) => (
                <Chip key={t.tag} size="sm" variant="soft" color="default">
                  {`{{${t.tag}}}`} — {t.label}
                </Chip>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Live preview */}
        <div className="lg:col-span-5">
          <SectionCard
            title="Preview"
            description={`Sample receipt · ${RECEIPT_LAYOUT_LABEL[active]}`}
            action={
              <Button size="sm" variant="outline" onPress={() => printReceipt(active, design, previewData)}>
                <PrinterIcon className="size-4" /> Test print
              </Button>
            }
          >
            <div className="bg-default-100 rounded-lg p-4">
              <ScaledReceipt layout={active} design={design} data={previewData} />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
