/**
 * Entity types.
 *
 * These double as the future MongoDB document shapes, so a few rules hold
 * throughout:
 *
 *  - every entity has a readable string `_id` (Mongo accepts custom string
 *    `_id`, so `'prv-0007'` migrates verbatim and stays legible in Compass);
 *  - every entity carries `createdAt` / `updatedAt`;
 *  - relations are id references, never nested documents;
 *  - no field name starts with `$` or contains `.`;
 *  - all timestamps are naive-local `YYYY-MM-DDTHH:mm` strings anchored to the
 *    frozen clock in `lib/data/clock.ts`.
 *
 * The buckets in `AppState.entities` are the future collections, one for one.
 */

/* ==========================================================================
   Primitives
   ========================================================================== */

export interface Doc {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

/** Drives badge colour. Never the sole carrier of meaning — always paired with a label. */
export type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

export type Role = "guest" | "customer" | "provider" | "admin";

export type AccountStatus = "active" | "suspended";

export type RequestStatus = "open" | "quoted" | "booked" | "cancelled" | "expired";
export type QuoteStatus = "sent" | "accepted" | "declined" | "withdrawn";
export type BookingStatus = "upcoming" | "active" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";
export type VerificationStatus = "pending" | "approved" | "rejected";
export type DisputeStatus = "open" | "investigating" | "resolved" | "rejected";

export type UrgencyLevel = "flexible" | "soon" | "urgent";

/** Slug of a lucide icon, resolved centrally by `components/domain/category-icon.tsx`. */
export type IconKey =
  | "wrench"
  | "zap"
  | "wind"
  | "washing-machine"
  | "sparkles"
  | "paint-roller"
  | "hammer"
  | "bug"
  | "cctv"
  | "wifi"
  | "truck"
  | "sofa"
  | "sprout"
  | "house";

/* ==========================================================================
   Taxonomy
   ========================================================================== */

export interface Category extends Doc {
  slug: string;
  bnName: string;
  bnShortName: string;
  bnDescription: string;
  icon: IconKey;
  /** Ink/teal tint index, 0–5. Keeps card tiles on-palette. */
  tint: number;
  priceFrom: number;
  priceTo: number;
  /** Typical job length in minutes. */
  avgDurationMinutes: number;
  jobCount: number;
  providerCount: number;
  isActive: boolean;
  isPopular: boolean;
  subServices: string[];
}

export interface Area extends Doc {
  slug: string;
  bnName: string;
  providerCount: number;
  isActive: boolean;
  /** Percentage coordinates for the stylized Chattogram map hotspots. */
  mapX: number;
  mapY: number;
  isHeadline: boolean;
}

export interface Service extends Doc {
  categoryId: string;
  bnName: string;
  bnDescription: string;
  priceFrom: number;
  priceTo: number;
  durationMinutes: number;
}

/* ==========================================================================
   People
   ========================================================================== */

export interface Customer extends Doc {
  bnName: string;
  phone: string;
  email: string;
  areaId: string;
  addressIds: string[];
  status: AccountStatus;
  bookingCount: number;
}

export interface PortfolioItem {
  id: string;
  categoryId: string;
  bnCaption: string;
}

export interface Provider extends Doc {
  slug: string;
  bnName: string;
  bnTitle: string;
  bnBio: string;
  phone: string;
  categoryIds: string[];
  areaId: string;
  serviceAreaIds: string[];
  rating: number;
  reviewCount: number;
  completedJobs: number;
  isVerified: boolean;
  status: AccountStatus;
  experienceYears: number;
  responseMinutes: number;
  priceFrom: number;
  /** Per-category price overrides, keyed by category id. */
  categoryPricing: Record<string, number>;
  /** Category ids the provider currently accepts work for. */
  activeCategoryIds: string[];
  portfolio: PortfolioItem[];
  bnBadges: string[];
  joinedAt: string;
  isFeatured: boolean;
  /** `availability[weekdayIndex]` → slot keys the provider offers. */
  availability: Record<number, string[]>;
}

export interface Address extends Doc {
  customerId: string;
  bnLabel: string;
  bnLine1: string;
  bnLine2: string;
  areaId: string;
  isDefault: boolean;
}

/* ==========================================================================
   Marketplace flow
   ========================================================================== */

export interface ServiceRequest extends Doc {
  customerId: string;
  categoryId: string;
  bnTitle: string;
  bnDescription: string;
  areaId: string;
  addressId: string | null;
  preferredDate: string;
  preferredSlot: string;
  urgency: UrgencyLevel;
  budgetFrom: number | null;
  budgetTo: number | null;
  status: RequestStatus;
  quoteIds: string[];
  bookingId: string | null;
}

export interface Quote extends Doc {
  requestId: string;
  providerId: string;
  customerId: string;
  /** What the customer pays. */
  amount: number;
  /**
   * What the provider receives. Agreed between admin and provider before the
   * quotation goes out; `amount - providerPayout` is the platform's commission.
   */
  providerPayout: number;
  /** The admin's note to the customer. */
  bnMessage: string;
  estimatedMinutes: number;
  status: QuoteStatus;
  /** Naive-local timestamp after which the quote lapses. */
  validUntil: string;
}

export interface Booking extends Doc {
  requestId: string | null;
  quoteId: string | null;
  customerId: string;
  providerId: string;
  categoryId: string;
  bnTitle: string;
  addressId: string;
  areaId: string;
  scheduledDate: string;
  scheduledSlot: string;
  durationMinutes: number;
  amount: number;
  /** Ghorly's cut, in BDT. */
  commission: number;
  status: BookingStatus;
  paymentId: string | null;
  reviewId: string | null;
  bnCancelReason: string | null;
}

export interface Review extends Doc {
  bookingId: string;
  providerId: string;
  customerId: string;
  categoryId: string;
  rating: number;
  bnBody: string;
  isHidden: boolean;
  bnProviderReply: string | null;
}

/* ==========================================================================
   Money
   ========================================================================== */

export type PaymentMethodKind = "bkash" | "nagad" | "rocket" | "card" | "cash" | "bank";

export interface Payment extends Doc {
  bookingId: string;
  customerId: string;
  providerId: string;
  amount: number;
  commission: number;
  method: PaymentMethodKind;
  status: PaymentStatus;
  /** Masked account or card tail, e.g. `01712****78`. */
  reference: string;
  paidAt: string | null;
}

export interface PayoutMethod extends Doc {
  ownerId: string;
  kind: PaymentMethodKind;
  bnLabel: string;
  reference: string;
  isDefault: boolean;
}

/* ==========================================================================
   Messaging
   ========================================================================== */

/**
 * A support conversation between the Ghorly team and exactly one party.
 *
 * Customers and providers never talk to each other — the admin is in the
 * middle of every job — so a thread belongs to one customer (`kind:
 * "customer"`) or one provider (`kind: "provider"`), never both.
 */
export interface MessageThread extends Doc {
  kind: "customer" | "provider";
  customerId: string | null;
  providerId: string | null;
  bookingId: string | null;
  requestId: string | null;
  bnSubject: string;
  lastMessageAt: string;
  messageIds: string[];
}

export interface Message extends Doc {
  threadId: string;
  /** `system` messages narrate state changes: "কোটেশন পাঠানো হয়েছে". */
  senderRole: "customer" | "provider" | "admin" | "system";
  senderId: string;
  bnBody: string;
  sentAt: string;
  /** Read by the other end of the thread (drives the ✓✓ receipt). */
  isRead: boolean;
  /** When the other end read it — naive-local, set with `isRead`. */
  readAt?: string | null;
}

/* ==========================================================================
   Trust & safety
   ========================================================================== */

export type VerificationDocKind = "nid" | "photo" | "trade-license" | "reference" | "skill-cert";

export interface VerificationDoc {
  kind: VerificationDocKind;
  bnLabel: string;
  isSubmitted: boolean;
}

export interface Verification extends Doc {
  providerId: string;
  status: VerificationStatus;
  docs: VerificationDoc[];
  submittedAt: string;
  reviewedAt: string | null;
  bnNote: string | null;
}

export interface Dispute extends Doc {
  bookingId: string;
  raisedByRole: "customer" | "provider";
  raisedById: string;
  bnReason: string;
  bnDetail: string;
  status: DisputeStatus;
  bnResolution: string | null;
  resolvedAt: string | null;
}

/* ==========================================================================
   Marketing content
   ========================================================================== */

export interface Testimonial extends Doc {
  bnName: string;
  areaId: string;
  categoryId: string;
  rating: number;
  bnBody: string;
}

/* ==========================================================================
   Admin analytics
   ========================================================================== */

export interface SeriesPoint {
  /** Bangla-ready label already resolved at authoring time, e.g. `মার্চ`. */
  label: string;
  value: number;
}

export interface AdminMetrics {
  totalCustomers: number;
  totalProviders: number;
  activeRequests: number;
  completedJobs: number;
  revenue: number;
  commission: number;
  /** Month-over-month deltas, as whole percentages. */
  deltas: {
    customers: number;
    providers: number;
    requests: number;
    jobs: number;
    revenue: number;
    commission: number;
  };
  revenueByMonth: SeriesPoint[];
  bookingsByMonth: SeriesPoint[];
  userGrowthByWeek: { label: string; customers: number; providers: number }[];
  bookingsByCategory: SeriesPoint[];
}

/* ==========================================================================
   Request draft (wizard, UI-only — never persisted as a collection)
   ========================================================================== */

export interface RequestDraft {
  step: number;
  categoryId: string | null;
  bnTitle: string;
  bnDescription: string;
  areaId: string | null;
  addressId: string | null;
  bnAddressLine: string;
  preferredDate: string | null;
  preferredSlot: string | null;
  urgency: UrgencyLevel;
  budgetFrom: number | null;
  budgetTo: number | null;
}
