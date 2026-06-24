import type { ReactNode } from "react";

/**
 * Passthrough group layout. The dashboard shell lives in
 * `admin/[slug]/(dash)/layout.tsx` so the slug-scoped login page
 * (`admin/[slug]/login`) renders without the sidebar/topbar.
 */
export default function TenantLayout({ children }: { children: ReactNode }) {
  return children;
}
