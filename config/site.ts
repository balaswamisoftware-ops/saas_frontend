/**
 * Product-wide configuration. Both the SaaS platform console and the tenant
 * admin dashboard read from here so branding/links live in one place.
 */
export const siteConfig = {
  name: "Seva CRM",
  shortName: "Seva",
  description:
    "Multi-tenant CRM for spiritual & service organisations — manage devotees, sevas, donations and events.",
  url: "https://sevacrm.app",
  supportEmail: "support@sevacrm.app",
  company: "SriVidyaPitam",
} as const;

export type SiteConfig = typeof siteConfig;
