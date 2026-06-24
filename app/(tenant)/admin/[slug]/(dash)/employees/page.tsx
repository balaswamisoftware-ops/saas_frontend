"use client";
import { useAdminPath } from "@/lib/use-admin-path";

import { useRouter, useParams } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button, PageHeader, RefreshButton, SectionCard } from "@/components/ui";
import { UserTable } from "@/components/common/user-table";
import { useEmployees } from "@/hooks";

export default function EmployeesPage() {
  const router = useRouter();
  const adminPath = useAdminPath();
  const { slug } = useParams<{ slug: string }>();
  const { employees, reload } = useEmployees(slug);

  return (
    <div>
      <PageHeader
        title="Employees"
        description="People in your organisation and the role each one is assigned."
        actions={
          <>
            <RefreshButton onRefresh={reload} />
            <Button variant="primary" onPress={() => router.push(adminPath("/employees/new"))}>
              <UserPlus className="size-4" /> Add employee
            </Button>
          </>
        }
      />
      <SectionCard flush>
        <UserTable
          aria-label="Employees"
          users={employees}
          showPin
          onEdit={(u) => router.push(adminPath(`/employees/${u.id}/edit`))}
        />
      </SectionCard>
    </div>
  );
}
