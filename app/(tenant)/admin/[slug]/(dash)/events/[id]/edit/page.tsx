"use client";

import { useParams } from "next/navigation";
import { useApi, useTenant } from "@/hooks";
import { EventForm } from "../../event-form";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const { api } = useTenant();
  const { data, loading, error } = useApi(() => api.events.get(id), [id]);

  if (loading) return <div className="text-foreground/50 p-6">Loading…</div>;
  if (error || !data) return <div className="text-foreground/50 p-6">Not found.</div>;

  return <EventForm event={data} />;
}
