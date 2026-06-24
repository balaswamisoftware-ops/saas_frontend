"use client";

import { useParams } from "next/navigation";
import { useApi, useTenant } from "@/hooks";
import { DevoteeForm } from "../../devotee-form";

export default function EditDevoteePage() {
  const { id } = useParams<{ id: string }>();
  const { api } = useTenant();
  const { data, loading, error } = useApi(() => api.devotees.get(id), [id]);

  if (loading) return <div className="text-foreground/50 p-6">Loading…</div>;
  if (error || !data) return <div className="text-foreground/50 p-6">Not found.</div>;

  return <DevoteeForm devotee={data} />;
}
