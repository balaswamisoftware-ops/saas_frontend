"use client";

import { useParams } from "next/navigation";
import { useApi } from "@/hooks";
import { tenantsApi } from "@/lib/api/services";
import { TenantForm } from "../../tenant-form";

export default function EditTenantPage() {
  const { id } = useParams<{ id: string }>();
  const { data: tenant, loading } = useApi(() => tenantsApi.get(id), [id]);

  if (loading) return <div className="text-foreground/50 p-6">Loading…</div>;
  if (!tenant) return <div className="text-foreground/50 p-6">Not found.</div>;

  return <TenantForm tenant={tenant} />;
}
