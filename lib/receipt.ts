/**
 * Receipt layouts — the single source of truth for how a receipt is rendered.
 *
 * A receipt = a designer-controlled HEADER + FOOTER (rich HTML, authored in the
 * TipTap editor, with `{{merge tags}}`) wrapped around BASIC structural blocks
 * (title, meta, item table, total) that stay built-in so totals/columns are
 * always correct. `buildReceiptBody` produces the HTML body we preview on screen
 * and send to the printer; `printReceipt` streams it to an iframe and prints.
 */

import type { ReceiptLayout } from "@/types";
import { formatCurrency, formatDate } from "@/lib/format";

/* ------------------------------------------------------------------ */
/* Data                                                               */
/* ------------------------------------------------------------------ */

export interface ReceiptLine {
  label: string;
  qty: number;
  amount: number;
}

export interface ReceiptData {
  orgName: string;
  /** Organisation logo URL — printed faintly as a centered watermark. */
  logo?: string;
  addressLines: string[];
  phone?: string;
  gstin?: string;
  reg80g?: string;
  /** Org PAN — shown on the formal A4 donor receipt. */
  pan?: string;
  receiptNo: string;
  date: string;
  devoteeName: string;
  /** Donor's address — shown on the A4 donor receipt when present. */
  donorAddress?: string;
  /** Donor's PAN — shown on the A4 donor receipt when present. */
  donorPan?: string;
  /** Donor's gotra — printed on the receipt when present. */
  gotra?: string;
  /** Donor's nakshatra — printed on the receipt when present. */
  nakshatra?: string;
  paymentMode: string;
  lines: ReceiptLine[];
}

/** Sample receipt used for previewing a layout in the designer / printers. */
export const SAMPLE_RECEIPT: ReceiptData = {
  orgName: "SriVidya Pitam",
  addressLines: ["12-3-45, Temple Road, Beside Kalyana Mandapam", "Hyderabad, Telangana 500001"],
  phone: "+91 98480 00000",
  gstin: "36ABCDE1234F1Z5",
  reg80g: "AAATS1234F / 80G / 2023-24",
  pan: "AAATS1234F",
  receiptNo: "RC-1045",
  date: "2026-06-23",
  devoteeName: "Sita Mahalakshmi",
  donorAddress: "Flat 4B, Lotus Residency, Banjara Hills, Hyderabad 500034",
  donorPan: "ABCDX1234K",
  gotra: "Kashyapa",
  nakshatra: "Ashwini",
  paymentMode: "Cash",
  lines: [
    { label: "Archana", qty: 2, amount: 232 },
    { label: "Abhishekam", qty: 1, amount: 516 },
    { label: "Annadanam Sponsorship", qty: 1, amount: 5000 },
  ],
};

/* ------------------------------------------------------------------ */
/* Layout dimensions                                                  */
/* ------------------------------------------------------------------ */

export const RECEIPT_LAYOUT_LABEL: Record<ReceiptLayout, string> = {
  "55mm": "55 mm (thermal)",
  "80mm": "80 mm (thermal)",
  a4: "A4 (sheet)",
};

const DIM: Record<ReceiptLayout, { width: string; page: string; pad: string; font: string; pageMargin: string }> = {
  "55mm": { width: "55mm", page: "55mm auto", pad: "2mm", font: "8.5px", pageMargin: "0" },
  "80mm": { width: "80mm", page: "80mm auto", pad: "3mm", font: "11px", pageMargin: "0" },
  a4: { width: "210mm", page: "A4", pad: "14mm", font: "13px", pageMargin: "10mm" },
};

const isThermal = (l: ReceiptLayout) => l !== "a4";

/* ------------------------------------------------------------------ */
/* Design (authored in the layout designer)                           */
/* ------------------------------------------------------------------ */

export interface ReceiptDesign {
  /** Rich HTML rendered above the structural blocks. Supports merge tags. */
  headerHtml: string;
  /** Rich HTML rendered below the structural blocks. Supports merge tags. */
  footerHtml: string;
  /** Heading printed between header and the body (e.g. receipt type). */
  title: string;
  showMeta: boolean;
  showItems: boolean;
  showTotal: boolean;
  /** Print the total amount spelled out in words (donor receipts). */
  showAmountInWords: boolean;
  /** 80G / tax declaration paragraph. Supports merge tags. Empty = hidden. */
  declaration: string;
  /** Signatory line, e.g. "For SriVidya Pitam". Supports merge tags. Empty = hidden. */
  signatory: string;
}

/** Fields that can be dropped into the header/footer rich text. */
export const MERGE_TAGS = [
  { tag: "orgName", label: "Organisation name" },
  { tag: "address", label: "Address" },
  { tag: "phone", label: "Phone" },
  { tag: "gstin", label: "GSTIN" },
  { tag: "pan", label: "Org PAN" },
  { tag: "reg80g", label: "80G reg. no." },
  { tag: "receiptNo", label: "Receipt no." },
  { tag: "date", label: "Date" },
  { tag: "devoteeName", label: "Devotee name" },
  { tag: "donorAddress", label: "Donor address" },
  { tag: "donorPan", label: "Donor PAN" },
  { tag: "gotra", label: "Gotra" },
  { tag: "nakshatra", label: "Nakshatra" },
  { tag: "paymentMode", label: "Payment mode" },
  { tag: "total", label: "Total amount" },
  { tag: "amountInWords", label: "Amount in words" },
] as const;

const THERMAL_HEADER = `<p style="text-align:center"><strong>{{orgName}}</strong></p>
<p style="text-align:center">{{address}}</p>
<p style="text-align:center">Ph: {{phone}} &nbsp;|&nbsp; GSTIN: {{gstin}}</p>
<p style="text-align:center">80G: {{reg80g}}</p>`;

const THERMAL_FOOTER = `<p style="text-align:center">Thank you for your kind contribution.</p>
<p style="text-align:center">॥ Om Namah Shivaya ॥</p>`;

/** Compact ticket for the thermal printers. */
function thermalDesign(): ReceiptDesign {
  return {
    headerHtml: THERMAL_HEADER,
    footerHtml: THERMAL_FOOTER,
    title: "DONATION / SEVA RECEIPT",
    showMeta: true,
    showItems: true,
    showTotal: true,
    showAmountInWords: false,
    declaration: "",
    signatory: "",
  };
}

const A4_HEADER = `<p style="text-align:center;font-size:1.8em;font-weight:700;letter-spacing:0.02em">{{orgName}}</p>
<p style="text-align:center">{{address}}</p>
<p style="text-align:center">Ph: {{phone}} &nbsp;|&nbsp; GSTIN: {{gstin}} &nbsp;|&nbsp; PAN: {{pan}}</p>
<p style="text-align:center">80G Reg. No: {{reg80g}}</p>`;

const A4_FOOTER = `<p style="text-align:center;font-style:italic">Thank you for your generous contribution towards the seva of the temple.</p>
<p style="text-align:center">॥ Om Namah Shivaya ॥</p>`;

const A4_DECLARATION = `Donations made to {{orgName}} are eligible for deduction under Section 80G of the Income Tax Act, 1961. 80G Registration No: {{reg80g}}. Please retain this receipt for your tax records.`;

/** Formal, keep-worthy donor receipt for the A4 sheet. */
function a4Design(): ReceiptDesign {
  return {
    headerHtml: A4_HEADER,
    footerHtml: A4_FOOTER,
    title: "DONATION RECEIPT",
    showMeta: true,
    showItems: true,
    showTotal: true,
    showAmountInWords: true,
    declaration: A4_DECLARATION,
    signatory: "For {{orgName}}",
  };
}

export const DEFAULT_DESIGNS: Record<ReceiptLayout, ReceiptDesign> = {
  "55mm": thermalDesign(),
  "80mm": thermalDesign(),
  a4: a4Design(),
};

/** Spell an integer rupee amount in the Indian system (crore/lakh/...). */
export function rupeesInWords(value: number): string {
  const num = Math.floor(Math.abs(value));
  if (num === 0) return "Zero";
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (n: number): string => (n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? " " + ones[n % 10] : ""}`);
  const three = (n: number): string => {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return `${h ? ones[h] + " Hundred" + (r ? " " : "") : ""}${r ? two(r) : ""}`;
  };
  let n = num;
  let out = "";
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (crore) out += `${three(crore)} Crore `;
  if (lakh) out += `${three(lakh)} Lakh `;
  if (thousand) out += `${three(thousand)} Thousand `;
  if (n) out += three(n);
  return out.trim();
}

/* ------------------------------------------------------------------ */
/* Merge tags                                                         */
/* ------------------------------------------------------------------ */

function tagValues(data: ReceiptData): Record<string, string> {
  const total = data.lines.reduce((s, l) => s + l.amount, 0);
  return {
    orgName: data.orgName,
    address: data.addressLines.join(", "),
    phone: data.phone ?? "",
    gstin: data.gstin ?? "",
    reg80g: data.reg80g ?? "",
    pan: data.pan ?? "",
    receiptNo: data.receiptNo,
    date: formatDate(data.date),
    devoteeName: data.devoteeName,
    donorAddress: data.donorAddress ?? "",
    donorPan: data.donorPan ?? "",
    gotra: data.gotra ?? "",
    nakshatra: data.nakshatra ?? "",
    paymentMode: data.paymentMode,
    total: formatCurrency(total),
    amountInWords: `Rupees ${rupeesInWords(total)} only`,
  };
}

/** Replace `{{tag}}` placeholders in authored HTML with receipt values. */
export function applyMergeTags(html: string, data: ReceiptData): string {
  const values = tagValues(data);
  return html.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key: string) => values[key] ?? "");
}

/* ------------------------------------------------------------------ */
/* HTML builders                                                      */
/* ------------------------------------------------------------------ */

function rule(layout: ReceiptLayout) {
  return isThermal(layout)
    ? `<div style="border-top:1px dashed #000;margin:4px 0"></div>`
    : `<div style="border-top:1px solid #d4d4d4;margin:10px 0"></div>`;
}

function itemsBlock(layout: ReceiptLayout, data: ReceiptData) {
  if (isThermal(layout)) {
    const head = `<div style="display:flex;font-weight:700"><span style="flex:1">Particulars</span><span style="width:2.4em;text-align:right">Qty</span><span style="width:5.5em;text-align:right">Amount</span></div>`;
    const rows = data.lines
      .map(
        (l) =>
          `<div style="display:flex"><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.label}</span><span style="width:2.4em;text-align:right">${l.qty}</span><span style="width:5.5em;text-align:right">${formatCurrency(l.amount)}</span></div>`,
      )
      .join("");
    return head + rows;
  }
  const rows = data.lines
    .map(
      (l) =>
        `<tr style="border-bottom:1px solid #efefef"><td style="padding:6px 0">${l.label}</td><td style="padding:6px 0;text-align:right">${l.qty}</td><td style="padding:6px 0;text-align:right">${formatCurrency(l.amount)}</td></tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:1px solid #d4d4d4;text-align:left"><th style="padding:6px 0">Particulars</th><th style="padding:6px 0;text-align:right;width:4em">Qty</th><th style="padding:6px 0;text-align:right;width:8em">Amount</th></tr></thead><tbody>${rows}</tbody></table>`;
}

/**
 * Build the receipt HTML body (a single sized `<div>`) for on-screen preview
 * and for embedding into the print document. This is what gets sent to print.
 */
export function buildReceiptBody(
  layout: ReceiptLayout,
  design: ReceiptDesign,
  data: ReceiptData,
): string {
  const dim = DIM[layout];
  const total = data.lines.reduce((s, l) => s + l.amount, 0);
  const font = isThermal(layout)
    ? "'Courier New', ui-monospace, monospace"
    : "system-ui, -apple-system, sans-serif";

  const thermal = isThermal(layout);

  // Title — a highlighted band on A4, plain centered line on thermal.
  const title = design.title
    ? thermal
      ? `<div style="font-weight:700;text-align:center;letter-spacing:0.05em">${design.title}</div>`
      : `<div style="text-align:center;font-weight:700;letter-spacing:0.08em;background:#faf5ef;border:1px solid #e8ddcf;border-radius:4px;padding:6px 0;font-size:1.15em">${design.title}</div>`
    : "";

  // Gotra / Nakshatra — printed when present (Indian temple receipts).
  const gotraLine = [
    data.gotra ? `Gotra: ${data.gotra}` : "",
    data.nakshatra ? `Nakshatra: ${data.nakshatra}` : "",
  ]
    .filter(Boolean)
    .join(thermal ? " | " : " &nbsp;&nbsp; ");

  // Meta — compact on thermal; a labelled donor block on A4.
  const meta = thermal
    ? `<div style="display:flex;justify-content:space-between"><span>No: ${data.receiptNo}</span><span>${formatDate(
        data.date,
      )}</span></div><div>Received from: ${data.devoteeName}</div>${
        gotraLine ? `<div>${gotraLine}</div>` : ""
      }<div>Mode: ${data.paymentMode}</div>`
    : `<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span><strong>Receipt No:</strong> ${data.receiptNo}</span><span><strong>Date:</strong> ${formatDate(
        data.date,
      )}</span></div>
       <div style="color:#555">Received with sincere gratitude from:</div>
       <div style="font-size:1.15em;font-weight:600">${data.devoteeName}</div>
       ${gotraLine ? `<div style="margin-top:2px">${gotraLine}</div>` : ""}
       ${data.donorAddress ? `<div>${data.donorAddress}</div>` : ""}
       <div style="margin-top:4px">${data.donorPan ? `<strong>PAN:</strong> ${data.donorPan} &nbsp;&nbsp;` : ""}<strong>Payment mode:</strong> ${data.paymentMode}</div>`;

  const totalBlock = thermal
    ? `<div style="display:flex;justify-content:space-between;font-weight:700;font-size:1.1em"><span>TOTAL</span><span>${formatCurrency(
        total,
      )}</span></div>`
    : `<div style="display:flex;justify-content:space-between;align-items:center;background:#faf5ef;border:1px solid #e8ddcf;border-radius:4px;padding:8px 12px;font-weight:700;font-size:1.25em"><span>TOTAL DONATION</span><span>${formatCurrency(
        total,
      )}</span></div>`;

  // Donor-receipt extras (mainly A4): amount in words, 80G note, signatory.
  const amountWords = design.showAmountInWords
    ? `<div${thermal ? "" : ' style="margin-top:8px"'}><strong>In words:</strong> Rupees ${rupeesInWords(total)} only</div>`
    : "";
  const declaration = design.declaration.trim()
    ? thermal
      ? `<div style="font-size:0.9em">${applyMergeTags(design.declaration, data)}</div>`
      : `<div style="margin-top:12px;font-size:0.85em;font-style:italic;color:#444;background:#fafafa;border:1px solid #ececec;border-radius:4px;padding:8px 10px">${applyMergeTags(
          design.declaration,
          data,
        )}</div>`
    : "";
  const signatory = design.signatory.trim()
    ? `<div style="margin-top:${thermal ? "16px" : "44px"};text-align:right"><div style="display:inline-block;text-align:center;min-width:200px"><div style="border-top:1px solid #000;padding-top:4px">${applyMergeTags(
        design.signatory,
        data,
      )}</div><div style="font-size:0.85em;color:#555">Authorised Signatory</div></div></div>`
    : "";
  const donorExtras = [amountWords, declaration, signatory].filter(Boolean).join("");

  const parts = [
    applyMergeTags(design.headerHtml, data),
    title,
    design.showMeta ? meta : "",
    design.showItems ? itemsBlock(layout, data) : "",
    design.showTotal ? totalBlock : "",
    donorExtras,
    applyMergeTags(design.footerHtml, data),
  ].filter(Boolean);

  const content = parts.join(rule(layout));
  const frame = thermal ? "" : "border:2px solid #d9c9b3;border-radius:6px;";

  // Organisation logo printed as a faint, centered watermark behind the
  // content. An <img> (not a CSS background) so it prints reliably.
  const watermark = data.logo
    ? `<img src="${data.logo}" alt="" aria-hidden="true" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${
        thermal ? "82%" : "62%"
      };max-height:${thermal ? "72%" : "62%"};object-fit:contain;opacity:0.07;pointer-events:none;z-index:0" />`
    : "";

  return `<div style="position:relative;overflow:hidden;width:${dim.width};padding:${dim.pad};font-size:${dim.font};font-family:${font};color:#000;background:#fff;line-height:1.4;box-sizing:border-box;word-break:break-word;-webkit-print-color-adjust:exact;print-color-adjust:exact;${frame}">${watermark}<div style="position:relative;z-index:1">${content}</div></div>`;
}

/** Build a complete, self-contained HTML document for printing / sending. */
export function buildReceiptDocument(
  layout: ReceiptLayout,
  design: ReceiptDesign,
  data: ReceiptData,
): string {
  const dim = DIM[layout];
  return `<!doctype html><html><head><meta charset="utf-8"><title>${data.receiptNo}</title><style>@page{size:${dim.page};margin:${dim.pageMargin}}html,body{margin:0;padding:0}*{box-sizing:border-box}p{margin:0}</style></head><body>${buildReceiptBody(
    layout,
    design,
    data,
  )}</body></html>`;
}

/** Stream the receipt document to a hidden iframe and trigger the print dialog. */
export function printReceipt(layout: ReceiptLayout, design: ReceiptDesign, data: ReceiptData) {
  if (typeof window === "undefined") return;
  const doc = buildReceiptDocument(layout, design, data);
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
  document.body.appendChild(iframe);
  const win = iframe.contentWindow;
  if (!win) {
    iframe.remove();
    return;
  }
  win.document.open();
  win.document.write(doc);
  win.document.close();
  let printed = false;
  const doPrint = () => {
    if (printed) return;
    printed = true;
    win.focus();
    win.print();
    window.setTimeout(() => iframe.remove(), 1000);
  };
  const run = () => {
    // Wait for any images (e.g. the logo watermark) to load before printing,
    // with a safety timeout so a slow/broken image never blocks printing.
    const pending = Array.from(win.document.images ?? []).filter((im) => !im.complete);
    if (pending.length === 0) {
      window.setTimeout(doPrint, 80);
      return;
    }
    let left = pending.length;
    const tick = () => {
      if (--left <= 0) doPrint();
    };
    pending.forEach((im) => {
      im.addEventListener("load", tick);
      im.addEventListener("error", tick);
    });
    window.setTimeout(doPrint, 2500);
  };
  if (win.document.readyState === "complete") window.setTimeout(run, 80);
  else iframe.onload = run;
}

/* ------------------------------------------------------------------ */
/* Persistence — designs are stored on the tenant settings (backend).  */
/* These helpers map the stored record to/from a complete set, filling */
/* any missing layout with its default.                                */
/* ------------------------------------------------------------------ */

/** Merge stored (possibly partial) designs over the defaults. */
export function mergeDesigns(
  stored?: Partial<Record<ReceiptLayout, ReceiptDesign>> | null,
): Record<ReceiptLayout, ReceiptDesign> {
  return {
    "55mm": { ...DEFAULT_DESIGNS["55mm"], ...stored?.["55mm"] },
    "80mm": { ...DEFAULT_DESIGNS["80mm"], ...stored?.["80mm"] },
    a4: { ...DEFAULT_DESIGNS.a4, ...stored?.a4 },
  };
}

/** Resolve a single layout's design from stored settings. */
export function resolveDesign(
  layout: ReceiptLayout,
  stored?: Partial<Record<ReceiptLayout, ReceiptDesign>> | null,
): ReceiptDesign {
  return mergeDesigns(stored)[layout];
}

/* ------------------------------------------------------------------ */
/* Building real receipt data from org settings + a booking            */
/* ------------------------------------------------------------------ */

/** Organisation fields (structurally a subset of TenantSettings). */
export interface ReceiptOrg {
  name?: string;
  logoUrl?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  reg80g?: string;
}

/** A booking/sale to print (structurally a subset of Booking). */
export interface ReceiptBooking {
  receiptNo: string;
  soldAt?: string;
  date?: string;
  devoteeName: string;
  payment: string;
  sevaName: string;
  qty: number;
  amount: number;
}

const PAYMENT_LABEL: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  other: "Other",
};

/** Build the printable receipt data from the tenant's org settings + a sale. */
export function receiptFromBooking(org: ReceiptOrg, booking: ReceiptBooking): ReceiptData {
  const cityLine = [org.addressLine2, org.city, org.state, org.pincode].filter(Boolean).join(", ");
  const addressLines = [org.addressLine1, cityLine].filter((l): l is string => Boolean(l && l.trim()));
  return {
    orgName: org.name ?? "",
    logo: org.logoUrl,
    addressLines: addressLines.length ? addressLines : [""],
    phone: org.phone,
    gstin: org.gstin,
    pan: org.pan,
    reg80g: org.reg80g,
    receiptNo: booking.receiptNo,
    date: booking.soldAt ?? booking.date ?? "",
    devoteeName: booking.devoteeName,
    paymentMode: PAYMENT_LABEL[booking.payment] ?? booking.payment,
    lines: [{ label: booking.sevaName, qty: booking.qty, amount: booking.amount }],
  };
}
