"use client";

import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import {
  Button,
  PageHeader,
  RefreshButton,
  SectionCard,
} from "@/components/ui";
import { UserTable } from "@/components/common/user-table";
import { useEmployees } from "@/hooks";

export default function EmployeesPage() {
  const router = useRouter();
  const { employees } = useEmployees();

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Internal staff who can sign in to the platform console only."
        actions={
          <>
            <RefreshButton />
            <Button variant="primary" onPress={() => router.push("/saas/employees/new")}>
              <UserPlus className="size-4" /> Add employee
            </Button>
          </>
        }
      />
      <SectionCard flush>
        <UserTable aria-label="Platform employees" users={employees} />
      </SectionCard>
    </div>
  );
}
