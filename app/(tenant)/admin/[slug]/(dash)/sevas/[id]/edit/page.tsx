"use client";

import { useParams } from "next/navigation";
import { useApi, useTenant } from "@/hooks";
import { SevaForm } from "../../seva-form";

export default function EditSevaPage() {
  const { id } = useParams<{ id: string }>();
  const { api } = useTenant();
  const { data, loading, error } = useApi(() => api.sevas.get(id), [id]);

  if (loading) return <div className="text-foreground/50 p-6">Loading…</div>;
  if (error || !data) return <div className="text-foreground/50 p-6">Not found.</div>;

  return <SevaForm seva={data} />;
}
