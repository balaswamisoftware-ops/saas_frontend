import type { Metadata } from "next";
import { TenantLogin } from "./tenant-login";

export const metadata: Metadata = { title: "Sign in" };

/**
 * Tenant-scoped login at `/admin/{slug}/login`.
 *
 * The client app is handed this slug-injected URL. On submit the backend
 * resolves the slug to a tenant id (tenant details API) and authenticates the
 * staff member by their PIN.
 */
export default async function TenantLoginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <TenantLogin slug={slug} />;
}
