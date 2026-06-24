/**
 * Client for the local Seva Print Bridge — prints receipts to a NETWORK thermal
 * printer (ESC/POS over TCP) that the browser/cloud backend can't reach directly.
 *
 * The bridge runs on a PC on the same LAN as the printer. Browsers allow HTTPS
 * pages to call `http://localhost`, so this works from the deployed app too.
 */
import type { Printer, ReceiptLayout } from "@/types";
import type { TenantSettings } from "@/lib/api/services";

const BRIDGE_URL = process.env.NEXT_PUBLIC_PRINT_BRIDGE_URL ?? "http://localhost:9101";
const PRINTER_RAW_PORT = 9100;

export interface BridgeReceiptItem {
  name: string;
  qty: number;
  amount: number;
}

export interface BridgeReceipt {
  width: number;
  org: {
    name?: string;
    line1?: string;
    line2?: string;
    cityLine?: string;
    phone?: string;
    gstin?: string;
  };
  receiptNo: string;
  dateText: string;
  devotee?: string;
  soldBy?: string;
  items: BridgeReceiptItem[];
  total: number;
  currency?: string;
  paymentLabel?: string;
  footer?: string;
}

/** Char columns per line for the given paper size. */
export function layoutWidth(layout: ReceiptLayout): number {
  return layout === "55mm" ? 32 : 48;
}

/** Is this printer a network printer the bridge can drive? */
export function isNetworkPrinter(printer?: Printer | null): printer is Printer & { ipAddress: string } {
  return Boolean(
    printer &&
      (printer.connection === "ethernet" || printer.connection === "wifi") &&
      printer.ipAddress,
  );
}

/** Builds the receipt payload the bridge formats into ESC/POS. */
export function buildBridgeReceipt(
  settings: Partial<TenantSettings> | null | undefined,
  data: {
    receiptNo: string;
    soldAt: string;
    devoteeName?: string;
    soldBy?: string;
    sevaName: string;
    qty: number;
    amount: number;
    currency?: string;
    paymentLabel?: string;
  },
  width: number,
): BridgeReceipt {
  const s = settings ?? {};
  const cityLine = [s.city, s.state, s.pincode].filter(Boolean).join(", ") || undefined;
  const dateText = new Date(data.soldAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return {
    width,
    org: {
      name: s.name,
      line1: s.addressLine1,
      line2: s.addressLine2,
      cityLine,
      phone: s.phone,
      gstin: s.gstin,
    },
    receiptNo: data.receiptNo,
    dateText,
    devotee: data.devoteeName,
    soldBy: data.soldBy,
    items: [{ name: data.sevaName, qty: data.qty, amount: data.amount }],
    total: data.amount,
    currency: data.currency,
    paymentLabel: data.paymentLabel,
  };
}

/** Sends a receipt to a network printer via the local bridge. Throws on failure. */
export async function printToNetwork(host: string, receipt: BridgeReceipt): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${BRIDGE_URL}/print`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ host, port: PRINTER_RAW_PORT, receipt }),
    });
  } catch {
    throw new Error("Print bridge not reachable — is it running on this PC?");
  }
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error ?? `Print failed (${res.status})`);
  }
}
