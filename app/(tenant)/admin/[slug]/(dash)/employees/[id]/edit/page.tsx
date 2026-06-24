"use client";

import { useParams } from "next/navigation";
import { useApi, useTenant } from "@/hooks";
import { EmployeeForm } from "../../employee-form";

export default function EditEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const { api } = useTenant();
  const { data: user, loading } = useApi(() => api.employees.get(id), [id]);

  if (loading) return <div className="text-foreground/50 p-6">Loading…</div>;
  if (!user) return <div className="text-foreground/50 p-6">Not found.</div>;

  return <EmployeeForm user={user} />;
}
