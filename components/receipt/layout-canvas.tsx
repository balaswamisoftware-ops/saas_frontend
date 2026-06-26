"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildReceiptBody, type ReceiptData, type ReceiptDesign, type ReceiptOverlay } from "@/lib/receipt";
import type { ReceiptLayout } from "@/types";
import { cn, clamp } from "@/lib/utils";

export interface LayoutCanvasProps {
  layout: ReceiptLayout;
  design: ReceiptDesign;
  data: ReceiptData;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Called with the updated overlay list as the user drags / resizes. */
  onChange: (overlays: ReceiptOverlay[]) => void;
}

type DragState = {
  id: string;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  ox: number;
  oy: number;
  ow: number;
  rectW: number;
  rectH: number;
} | null;

/**
 * Drag-and-drop layout editor. Renders the receipt content as a fixed-scale
 * background and the design's images as draggable / resizable overlays on top.
 * Positions are kept as % of the page, so what you arrange here is exactly what
 * prints (`buildReceiptBody` renders the same overlays).
 */
export function LayoutCanvas({ layout, design, data, selectedId, onSelect, onChange }: LayoutCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [box, setBox] = useState({ w: 0, h: 0 });

  const overlays = design.overlays ?? [];

  // Background = the receipt WITHOUT overlays (overlays are interactive here).
  const bgHtml = buildReceiptBody(layout, { ...design, overlays: [] }, data);

  useEffect(() => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!wrap || !card) return;
    const measure = () => {
      const w = card.offsetWidth;
      const h = card.offsetHeight;
      if (!w) return;
      setBox({ w, h });
      setScale(Math.min(1, wrap.clientWidth / w));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    ro.observe(card);
    return () => ro.disconnect();
  }, [bgHtml]);

  const drag = useRef<DragState>(null);

  const onMove = useCallback(
    (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dxPct = ((e.clientX - d.startX) / d.rectW) * 100;
      const dyPct = ((e.clientY - d.startY) / d.rectH) * 100;
      onChange(
        overlays.map((o) => {
          if (o.id !== d.id) return o;
          if (d.mode === "move") {
            return { ...o, xPct: clamp(d.ox + dxPct, 0, 100), yPct: clamp(d.oy + dyPct, 0, 100) };
          }
          return { ...o, wPct: clamp(d.ow + dxPct, 3, 100) };
        }),
      );
    },
    [overlays, onChange],
  );

  const onUp = useCallback(() => {
    drag.current = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  }, [onMove]);

  function startDrag(e: React.PointerEvent, o: ReceiptOverlay, mode: "move" | "resize") {
    e.stopPropagation();
    const rect = boxRef.current?.getBoundingClientRect();
    if (!rect) return;
    onSelect(o.id);
    drag.current = {
      id: o.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      ox: o.xPct,
      oy: o.yPct,
      ow: o.wPct,
      rectW: rect.width,
      rectH: rect.height,
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <div ref={wrapRef} className="flex w-full justify-center">
      <div style={{ width: box.w * scale || undefined, height: box.h * scale || undefined }}>
        <div
          ref={boxRef}
          className="relative bg-white shadow-md"
          style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: box.w || "max-content" }}
          onPointerDown={() => onSelect(null)}
        >
          <div ref={cardRef} dangerouslySetInnerHTML={{ __html: bgHtml }} />

          {overlays.map((o) => (
            <div
              key={o.id}
              onPointerDown={(e) => startDrag(e, o, "move")}
              className={cn(
                "absolute cursor-move",
                selectedId === o.id ? "outline-primary outline outline-2" : "hover:outline-default-300 hover:outline hover:outline-1",
              )}
              style={{ left: `${o.xPct}%`, top: `${o.yPct}%`, width: `${o.wPct}%`, opacity: o.opacity ?? 1 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.url} alt="" className="pointer-events-none block w-full select-none" draggable={false} />
              {selectedId === o.id ? (
                <span
                  onPointerDown={(e) => startDrag(e, o, "resize")}
                  className="bg-primary absolute -right-1.5 -bottom-1.5 size-3 cursor-se-resize rounded-full ring-2 ring-white"
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
