/**
 * Shared domain types used across the SaaS console and tenant admin dashboard.
 * These mirror what a real backend/API would return.
 */

export type ID = string;

export type Status = "active" | "inactive" | "pending" | "suspended" | "archived";

/** Console "personas" — drives navigation, theming and access. */
export type Workspace = "platform" | "tenant";

/* ------------------------------------------------------------------ */
/* Platform (SaaS) domain                                              */
/* ------------------------------------------------------------------ */

export type PlanTier = "free" | "starter" | "growth" | "enterprise";

export type BillingCycle = "monthly" | "yearly";

export interface Plan {
  id: ID;
  name: string;
  tier: PlanTier;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  seats: number;
  features: string[];
  isPublic: boolean;
}

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "paused";

export interface Subscription {
  id: ID;
  tenantId: ID;
  planId: ID;
  status: SubscriptionStatus;
  cycle: BillingCycle;
  seats: number;
  amount: number;
  currency: string;
  startedAt: string;
  renewsAt: string;
}

export interface Tenant {
  id: ID;
  name: string;
  slug: string;
  logoUrl?: string;
  ownerEmail: string;
  plan: PlanTier;
  status: Status;
  seats: number;
  membersCount: number;
  mrr: number;
  createdAt: string;
  country: string;
}

export type InvoiceStatus = "paid" | "open" | "void" | "uncollectible";

export interface Invoice {
  id: ID;
  number: string;
  tenantId: ID;
  tenantName: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string;
}

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

export type Role =
  | "superadmin" // platform staff
  | "owner"
  | "admin"
  | "manager"
  | "agent"
  | "viewer";

export interface User {
  id: ID;
  name: string;
  email: string;
  avatarUrl?: string;
  /** Legacy role enum (kept for compatibility). The API drives role via the
   *  fields below. */
  role?: Role;
  /** Id of the assigned role document. */
  roleId?: ID;
  /** Role key (e.g. "owner", "manager") and display name from the API. */
  roleKey?: string;
  roleName?: string;
  status: Status;
  tenantId?: ID | null;
  lastActiveAt?: string;
  /** Unique 6-digit PIN the employee uses to authenticate at the counter / POS. */
  pin?: string;
  /** Login password (platform employees). Visible only to platform admins. */
  password?: string;
  /** Primary phone. */
  phone?: string;
  /** Secondary / alternate phone. */
  altPhone?: string;
  /** Date of birth (YYYY-MM-DD). */
  dob?: string;
  gender?: Gender;
}

export interface AuditLog {
  id: ID;
  actor: string;
  action: string;
  target: string;
  ip: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Tenant (CRM) domain                                                 */
/* ------------------------------------------------------------------ */

export type Gender = "male" | "female" | "other";

export interface Devotee {
  id: ID;
  name: string;
  email: string;
  gender?: Gender;
  /** Primary phone. */
  phone: string;
  /** Secondary / alternate phone. */
  altPhone?: string;
  /** Aadhaar number (govt ID). */
  aadhaar?: string;
  city: string;
  address?: string;
  state?: string;
  country?: string;
  pincode?: string;
  gotra?: string;
  nakshatra?: string;
  tags: string[];
  totalDonations: number;
  status: Status;
  joinedAt: string;
  avatarUrl?: string;
}

export interface Seva {
  id: ID;
  name: string;
  category?: string;
  price: number;
  currency: string;
  durationMins?: number;
  active: boolean;
  bookingsCount: number;
}

export type BookingStatus = "confirmed" | "pending" | "completed" | "cancelled";

/** How payment was collected at the counter. */
export type PaymentMode = "cash" | "upi" | "card" | "other";

export interface Booking {
  id: ID;
  /** Printed receipt number, e.g. "RCP-2026-0010". */
  receiptNo: string;
  /** Booking reference, e.g. "BK20260623-0001". */
  bookingNo: string;
  /** Event the booking was made under. */
  eventName: string;
  sevaName: string;
  devoteeName: string;
  qty: number;
  /** Total amount collected. */
  amount: number;
  currency: string;
  payment: PaymentMode;
  /** Employee who took the sale at the counter. */
  soldBy: string;
  /** When the sale was made (ISO datetime). */
  soldAt: string;
  status: BookingStatus;
  /** Legacy date (YYYY-MM-DD) — used by the edit form. */
  date?: string;
}

/** A configurable category a donation can be assigned to (e.g. "Annadanam"). */
export interface DonationPurpose {
  id: ID;
  name: string;
  description?: string;
  /** Optional preset amount suggested at the counter / form. */
  suggestedAmount?: number;
  active: boolean;
  /** Number of donations recorded against this purpose. */
  donationsCount: number;
  /** Total amount raised under this purpose. */
  totalRaised: number;
}

/* ------------------------------------------------------------------ */
/* Hardware                                                            */
/* ------------------------------------------------------------------ */

export type PrinterConnection = "ethernet" | "usb" | "wifi" | "bluetooth";

export type PrinterStatus = "online" | "offline" | "disabled";

/** Receipt paper size / template a printer renders to. */
export type ReceiptLayout = "55mm" | "80mm" | "a4";

export interface Printer {
  id: ID;
  name: string;
  model?: string;
  connection: PrinterConnection;
  /** IP address — relevant for Ethernet / WiFi connections. */
  ipAddress?: string;
  /** Receipt layout/template this printer prints. */
  layout: ReceiptLayout;
  /** Id of another printer to fall back to when this one is unavailable. */
  backupPrinterId?: ID;
  notes?: string;
  status: PrinterStatus;
}

export type DonationMethod = "card" | "upi" | "cash" | "bank" | "cheque";

export interface Donation {
  id: ID;
  devoteeName: string;
  amount: number;
  currency: string;
  method: DonationMethod;
  purpose: string;
  receiptNo: string;
  date: string;
  /** Event the donation was made under (optional). */
  eventName?: string;
  anonymous?: boolean;
  mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  /** Donor PAN — for the 80G certificate. */
  pan?: string;
  gotra?: string;
  nakshatra?: string;
  /** Whether an 80G tax-exempt receipt should be issued. */
  issue80g?: boolean;
  /** Internal note, not printed on the receipt. */
  notes?: string;
}

export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export interface CrmEvent {
  id: ID;
  title: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  capacity?: number;
  registered: number;
  status: EventStatus;
  /** Names of sevas devotees can book tickets for at this event. */
  sevas?: string[];
  /** Printer that issues receipts/tickets for this event's counter. */
  printerId?: ID;
}

/* ------------------------------------------------------------------ */
/* UI helpers                                                          */
/* ------------------------------------------------------------------ */

/** A single metric tile shown on dashboards. */
export interface Metric {
  label: string;
  value: string;
  delta?: number;
  trend?: "up" | "down" | "flat";
  hint?: string;
}
