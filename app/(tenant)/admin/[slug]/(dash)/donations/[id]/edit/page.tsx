"use client";

import { useParams } from "next/navigation";
import { useApi } from "@/hooks";
import { useTenant } from "@/hooks";
import { DonationForm } from "../../donation-form";

export default function EditDonationPage() {
  const { id } = useParams<{ id: string }>();
  const { api } = useTenant();
  const { data, loading, error } = useApi(() => api.donations.get(id), [id]);

  if (loading) return <div className="text-foreground/50 p-6">Loading…</div>;
  if (error || !data) return <div className="text-foreground/50 p-6">Not found.</div>;

  return <DonationForm donation={data} />;
}
