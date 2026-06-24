/**
 * RBAC helpers shared across the platform console. These are pure logic (not
 * data), mirroring the backend's role rules.
 */

/** Platform roles allowed to impersonate a tenant workspace. */
export const IMPERSONATOR_ROLES = ["superadmin", "admin"] as const;

export function canImpersonate(roleKey?: string | null): boolean {
  return !!roleKey && (IMPERSONATOR_ROLES as readonly string[]).includes(roleKey);
}
