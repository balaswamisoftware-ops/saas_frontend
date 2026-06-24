"use client";

import { useMemo } from "react";
import { platformApi, tenantApi } from "@/lib/api/services";
import type { User } from "@/types";
import { useResource } from "./useResource";
import { usePagination } from "./usePagination";

/**
 * Employee management hook for either console. Pass a tenant `slug` for the
 * tenant workspace, or omit it for the platform (SaaS) staff list.
 */
export function useEmployees(slug?: string) {
  const resource = useMemo(
    () => (slug ? tenantApi(slug).employees : platformApi.employees),
    [slug]
  );
  const pagination = usePagination({ initialSort: "createdAt" });
  const list = useResource<User>(resource, pagination.params);

  return { ...list, pagination, employees: list.items };
}
