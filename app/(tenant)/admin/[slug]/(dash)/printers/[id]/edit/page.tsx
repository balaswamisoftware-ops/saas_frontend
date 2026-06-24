"use client";

import { useParams } from "next/navigation";
import { useApi, useTenant } from "@/hooks";
import { PrinterForm } from "../../printer-form";

export default function EditPrinterPage() {
  const { id } = useParams<{ id: string }>();
  const { api } = useTenant();
  const { data, loading, error } = useApi(() => api.printers.get(id), [id]);

  if (loading) return <div className="text-foreground/50 p-6">Loading…</div>;
  if (error || !data) return <div className="text-foreground/50 p-6">Not found.</div>;

  return <PrinterForm printer={data} />;
}
