"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { tenantApi } from "@/lib/api/services";

/**
 * Resolves the current tenant slug (from the `[slug]` route segment) and a
 * memoised, slug-scoped API client. Use inside any page/component under
 * `/admin/[slug]/...` to talk to that tenant's resources.
 *
 *   const { slug, api } = useTenant();
 *   const { items } = useResource(api.devotees, params);
 */
export function useTenant() {
  const params = useParams<{ slug?: string }>();
  const slug = params?.slug ?? "";
  const api = useMemo(() => tenantApi(slug), [slug]);
  return { slug, api };
}
