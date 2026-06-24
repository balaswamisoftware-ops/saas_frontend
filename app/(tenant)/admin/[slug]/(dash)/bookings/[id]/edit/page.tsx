"use client";
import { useParams } from "next/navigation";
import { useTenant, useApi } from "@/hooks";
import { BookingForm } from "../../booking-form";

export default function EditBookingPage() {
  const { id } = useParams<{ id: string }>();
  const { api } = useTenant();
  const { data, loading, error } = useApi(() => api.bookings.get(id), [id]);

  if (loading) return <div className="text-foreground/50 p-6">Loading…</div>;
  if (error || !data) return <div className="text-foreground/50 p-6">Not found.</div>;

  return <BookingForm booking={data} />;
}
