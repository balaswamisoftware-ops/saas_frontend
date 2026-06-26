"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Printer as PrinterIcon, RotateCcw, Save, Trash2 } from "lucide-react";
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
import { LayoutCanvas } from "@/components/receipt/layout-canvas";
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
  type ReceiptOverlay,
} from "@/lib/receipt";
import type { ReceiptLayout } from "@/types";

const LAYOUTS: ReceiptLayout[] = ["55mm", "80mm", "a4"];

/** Stand-in logo so the layout can be positioned before a real logo is uploaded. */
const PLACEHOLDER_LOGO =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='80'><rect width='160' height='80' rx='8' fill='#ece7df'/><text x='80' y='46' font-family='sans-serif' font-size='17' fill='#b3a892' text-anchor='middle'>LOGO</text></svg>`,
  );

export default function ReceiptLayoutsPage() {
  const { api } = useTenant();
  const { data: settings, refetch } = useApi(() => api.settings.get(), []);
  const [active, setActive] = useState<ReceiptLayout>("80mm");
  const [previewKind, setPreviewKind] = useState<"seva" | "donation">("seva");
  const [designs, setDesigns] = useState<Record<ReceiptLayout, ReceiptDesign>>(DEFAULT_DESIGNS);
  const [saving, setSaving] = useState(false);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hydrate the designer from the tenant's saved layouts once settings load.
  useEffect(() => {
    if (settings) setDesigns(mergeDesigns(settings.receiptLayouts));
  }, [settings]);

  const design = designs[active];

  // Preview with the tenant's real organisation header (sample line items).
  const previewData: ReceiptData = {
    ...SAMPLE_RECEIPT,
    orgName: settings?.name ?? SAMPLE_RECEIPT.orgName,
    logo: settings?.logoUrl || PLACEHOLDER_LOGO,
    kind: previewKind,
    lines:
      previewKind === "donation"
        ? [
            { label: "General Donation", qty: 1, amount: 5000 },
            { label: "Annadanam Seva", qty: 1, amount: 2500 },
          ]
        : SAMPLE_RECEIPT.lines,
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

  const overlays = design.overlays ?? [];
  const setOverlays = (next: ReceiptOverlay[]) => update({ overlays: next });
  const updateOverlay = (id: string, patch: Partial<ReceiptOverlay>) =>
    setOverlays(overlays.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  function removeOverlay(id: string) {
    setOverlays(overlays.filter((o) => o.id !== id));
    setSelectedOverlay(null);
  }

  /** Upload an extra image to S3 (reuses the logo presign endpoint). */
  async function uploadImage(file: File): Promise<string> {
    const { uploadUrl, fileUrl } = await api.settings.logoUploadUrl({
      fileName: file.name,
      contentType: file.type,
    });
    const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
    if (!res.ok) throw new Error("Could not upload to storage");
    return fileUrl;
  }

  async function onAddImage(file: File | undefined) {
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImage(file);
      const id = `ov_${Date.now()}`;
      setOverlays([...overlays, { id, url, xPct: 35, yPct: 28, wPct: 25, opacity: 1 }]);
      setSelectedOverlay(id);
      toast.success("Image added — drag it to position, drag the corner to resize");
    } catch (e) {
      toast.danger((e as { message?: string }).message ?? "Could not add image");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
            onPress={() => {
              setActive(l);
              setSelectedOverlay(null);
            }}
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

          {active === "a4" ? (
            <SectionCard title="Logo" description="Organisation logo at the top of the A4 receipt. Upload it in Settings.">
              <div className="space-y-4">
                <SwitchOption
                  label="Show logo"
                  description="Print the organisation logo in the header"
                  isSelected={design.showLogo !== false}
                  onChange={(v) => update({ showLogo: v })}
                />
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-medium">Position</p>
                  <div className="flex gap-2">
                    {(["left", "center", "right"] as const).map((a) => (
                      <Button
                        key={a}
                        size="sm"
                        variant={(design.logoAlign ?? "center") === a ? "primary" : "outline"}
                        isDisabled={design.showLogo === false}
                        onPress={() => update({ logoAlign: a })}
                      >
                        {a[0].toUpperCase() + a.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-medium">Size</p>
                  <div className="flex gap-2">
                    {(["sm", "md", "lg"] as const).map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={(design.logoSize ?? "md") === s ? "primary" : "outline"}
                        isDisabled={design.showLogo === false}
                        onPress={() => update({ logoSize: s })}
                      >
                        {s.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : null}

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
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-foreground/55 self-center text-xs">Preview as:</span>
              {(["seva", "donation"] as const).map((k) => (
                <Button
                  key={k}
                  size="sm"
                  variant={previewKind === k ? "primary" : "outline"}
                  onPress={() => setPreviewKind(k)}
                >
                  {k === "seva" ? "Seva" : "Donation"}
                </Button>
              ))}
              {active === "a4" ? (
                <>
                  <span className="bg-default-200 mx-1 h-5 w-px" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => onAddImage(e.target.files?.[0])}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    isDisabled={uploadingImage}
                    onPress={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="size-4" /> {uploadingImage ? "Uploading…" : "Add image"}
                  </Button>
                </>
              ) : null}
            </div>

            {active === "a4" && selectedOverlay
              ? (() => {
                  const o = overlays.find((x) => x.id === selectedOverlay);
                  if (!o) return null;
                  return (
                    <div className="border-default-200 mb-3 flex flex-wrap items-center gap-3 rounded-lg border p-2 text-xs">
                      <span className="font-medium">Selected image</span>
                      <label className="flex items-center gap-1.5">
                        Opacity
                        <input
                          type="range"
                          min={10}
                          max={100}
                          value={Math.round((o.opacity ?? 1) * 100)}
                          onChange={(e) => updateOverlay(o.id, { opacity: Number(e.target.value) / 100 })}
                        />
                      </label>
                      <Button size="sm" variant="outline" onPress={() => updateOverlay(o.id, { opacity: 0.08 })}>
                        As watermark
                      </Button>
                      <Button size="sm" variant="ghost" onPress={() => removeOverlay(o.id)}>
                        <Trash2 className="size-4" /> Remove
                      </Button>
                    </div>
                  );
                })()
              : null}

            <div className="bg-default-100 rounded-lg p-4">
              {active === "a4" ? (
                <LayoutCanvas
                  layout={active}
                  design={design}
                  data={previewData}
                  selectedId={selectedOverlay}
                  onSelect={setSelectedOverlay}
                  onChange={setOverlays}
                />
              ) : (
                <ScaledReceipt layout={active} design={design} data={previewData} />
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
