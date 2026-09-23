import type { EntityKey } from "@/lib/store/types";

/**
 * The fifteen entity buckets map one-to-one onto fifteen MongoDB collections,
 * exactly as `lib/api/SCHEMA.md` describes. Collection names are the entity
 * keys verbatim, so there is nothing to translate in either direction.
 */
export const COLLECTIONS: EntityKey[] = [
  "categories",
  "areas",
  "providers",
  "customers",
  "addresses",
  "requests",
  "quotes",
  "bookings",
  "threads",
  "messages",
  "reviews",
  "payments",
  "payoutMethods",
  "disputes",
  "verifications",
];

/**
 * Indexes follow directly from the filters in `lib/api/queries.ts` — every
 * `.filter()` there is a query a real deployment would want served by an index.
 */
export const INDEXES: Record<string, Record<string, 1 | -1>[]> = {
  providers: [
    { areaId: 1 },
    { categoryIds: 1 },
    { serviceAreaIds: 1 },
    { isVerified: 1, rating: -1 },
  ],
  // `slug` is covered by the unique indexes below — declaring it here too
  // would collide on the auto-generated index name.
  categories: [],
  areas: [],
  addresses: [{ customerId: 1 }],
  requests: [{ status: 1, categoryId: 1, areaId: 1 }, { customerId: 1, createdAt: -1 }],
  quotes: [{ requestId: 1 }, { providerId: 1, createdAt: -1 }, { customerId: 1, createdAt: -1 }],
  bookings: [
    { customerId: 1, scheduledDate: -1 },
    { providerId: 1, scheduledDate: -1 },
    { status: 1 },
  ],
  payments: [{ providerId: 1, status: 1 }, { customerId: 1, createdAt: -1 }, { bookingId: 1 }],
  payoutMethods: [{ ownerId: 1 }],
  threads: [{ customerId: 1, lastMessageAt: -1 }, { providerId: 1, lastMessageAt: -1 }],
  messages: [{ threadId: 1, sentAt: 1 }],
  reviews: [{ providerId: 1, isHidden: 1, createdAt: -1 }, { bookingId: 1 }],
  verifications: [{ providerId: 1 }, { status: 1 }],
  disputes: [{ bookingId: 1 }, { status: 1 }],
};

/** Unique indexes — slugs address public URLs, so duplicates must be impossible. */
export const UNIQUE_INDEXES: Record<string, string> = {
  providers: "slug",
  categories: "slug",
  areas: "slug",
};

/**
 * Auth collections. Not seeded — accounts are created on first sign-in and
 * OTP challenges are transient — but they still need indexes, so they live
 * here with the rest rather than inside the `server-only` auth modules that
 * a script cannot import.
 */
export const AUTH_COLLECTIONS = ["accounts", "otpChallenges"] as const;

export const AUTH_INDEXES: {
  collection: string;
  spec: Record<string, 1 | -1>;
  options?: { unique?: boolean; expireAfterSeconds?: number };
}[] = [
  { collection: "accounts", spec: { phone: 1 }, options: { unique: true } },
  { collection: "otpChallenges", spec: { phone: 1, consumedAt: 1 } },
  // TTL: Mongo deletes expired challenges on its own, so stale codes cannot
  // pile up or be replayed.
  { collection: "otpChallenges", spec: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } },
];
