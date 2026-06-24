"use client";

import type { ReceiptLayout } from "@/types";
import {
  buildReceiptBody,
  DEFAULT_DESIGNS,
  SAMPLE_RECEIPT,
  type ReceiptData,
  type ReceiptDesign,
} from "@/lib/receipt";

// Re-export so existing importers keep a single entry point.
export { SAMPLE_RECEIPT, RECEIPT_LAYOUT_LABEL } from "@/lib/receipt";
export type { ReceiptData, ReceiptDesign, ReceiptLine } from "@/lib/receipt";

export interface ReceiptTemplateProps {
  layout: ReceiptLayout;
  /** Receipt content. Defaults to the sample receipt for previews. */
  data?: ReceiptData;
  /** Layout design (header/footer/toggles). Defaults to the built-in layout. */
  design?: ReceiptDesign;
  /** Adds the print id so only this element prints (see globals.css fallback). */
  forPrint?: boolean;
}

/**
 * On-screen preview of a receipt. Renders the exact HTML body that gets sent to
 * the printer (via `buildReceiptBody`) so what you see is what prints.
 */
export function ReceiptTemplate({ layout, data = SAMPLE_RECEIPT, design, forPrint }: ReceiptTemplateProps) {
  const html = buildReceiptBody(layout, design ?? DEFAULT_DESIGNS[layout], data);
  return <div id={forPrint ? "print-area" : undefined} dangerouslySetInnerHTML={{ __html: html }} />;
}
