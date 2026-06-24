"use client";

import { useParams } from "next/navigation";

/**
 * Returns a builder for tenant-scoped admin paths. Inside any page under
 * `/admin/[slug]/...` it injects the current slug:
 *
 *   const adminPath = useAdminPath();
 *   adminPath("/sevas/new")  ->  "/admin/acme/sevas/new"
 */
export function useAdminPath() {
  const params = useParams<{ slug?: string }>();
  const slug = params?.slug ?? "";
  return (sub = "") => {
    const tail = sub ? (sub.startsWith("/") ? sub : `/${sub}`) : "";
    return `/admin/${slug}${tail}`;
  };
}
