"use client";

import { useCallback, useMemo } from "react";
import { platformApi, tenantApi } from "@/lib/api/services";
import { useResource } from "./useResource";
import { usePagination } from "./usePagination";

export interface AuditLogEntry {
  id: string;
  scope: "platform" | "tenant";
  module: string;
  action: string;
  actorName: string;
  actorEmail?: string;
  targetLabel?: string;
  reverted: boolean;
  createdAt: string;
}

/**
 * Audit-trail hook. For the tenant console (`slug` provided) it also exposes
 * `revert(id)` so the Owner can roll back supported changes.
 */
export function useAuditLogs(slug?: string, extraFilters: Record<string, unknown> = {}) {
  const resource = useMemo(
    () => (slug ? tenantApi(slug).auditLogs : platformApi.auditLogs),
    [slug]
  );
  const pagination = usePagination({ initialSort: "createdAt" });
  const params = useMemo(
    () => ({ ...pagination.params, ...extraFilters }),
    [pagination.params, extraFilters]
  );
  const list = useResource<AuditLogEntry>(
    resource as Parameters<typeof useResource<AuditLogEntry>>[0],
    params
  );

  const revert = useCallback(
    async (id: string) => {
      if (!slug) throw new Error("Revert is only available in a tenant workspace");
      await tenantApi(slug).revertAudit(id);
      list.reload();
    },
    [slug, list]
  );

  return { ...list, logs: list.items, pagination, revert };
}
