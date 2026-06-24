"use client";

import { useEffect, useRef, useState } from "react";
import type { ReceiptLayout } from "@/types";
import { ReceiptTemplate } from "./receipt-template";
import type { ReceiptData, ReceiptDesign } from "@/lib/receipt";

export interface ScaledReceiptProps {
  layout: ReceiptLayout;
  design?: ReceiptDesign;
  data?: ReceiptData;
}

/**
 * Renders a receipt preview scaled down to fit its container width. An A4 sheet
 * is ~794px wide and would otherwise overflow a narrow preview panel — this
 * keeps the whole receipt visible (and readable) at any column width.
 */
export function ScaledReceipt({ layout, design, data }: ScaledReceiptProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const container = containerRef.current;
    const card = cardRef.current;
    if (!container || !card) return;

    const measure = () => {
      const naturalW = card.offsetWidth;
      const naturalH = card.offsetHeight;
      if (!naturalW) return;
      const avail = container.clientWidth;
      const s = Math.min(1, avail / naturalW);
      setScale(s);
      setBox({ w: naturalW, h: naturalH });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    ro.observe(card);
    return () => ro.disconnect();
  }, [layout, design, data]);

  return (
    <div ref={containerRef} className="flex w-full justify-center">
      {/* Reserve the scaled footprint so there's no clipping or extra space. */}
      <div style={{ width: box.w * scale || undefined, height: box.h * scale || undefined }}>
        <div
          ref={cardRef}
          className="bg-white shadow-md"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: "max-content",
          }}
        >
          <ReceiptTemplate layout={layout} design={design} data={data} />
        </div>
      </div>
    </div>
  );
}
