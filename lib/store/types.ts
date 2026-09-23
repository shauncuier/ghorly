import type {
  Address,
  Area,
  Booking,
  Category,
  Customer,
  Dispute,
  Message,
  MessageThread,
  Payment,
  PayoutMethod,
  Provider,
  Quote,
  RequestDraft,
  Review,
  Role,
  ServiceRequest,
  Verification,
} from "@/lib/types";

/**
 * Entities are normalized: a `Record<id, T>` plus a parallel `order` array.
 *
 * Two reasons, and the second matters more. O(1) updates without array-scan
 * boilerplate across ~45 reducer cases — and *stable list order*. A
 * denormalized array that gets re-sorted on every action makes rows visibly
 * jump around, which is the single clearest tell that a UI is a prototype.
 *
 * These fifteen buckets are also the fifteen future MongoDB collections.
 */
export interface Entities {
  categories: Record<string, Category>;
  areas: Record<string, Area>;
  providers: Record<string, Provider>;
  customers: Record<string, Customer>;
  addresses: Record<string, Address>;
  requests: Record<string, ServiceRequest>;
  quotes: Record<string, Quote>;
  bookings: Record<string, Booking>;
  threads: Record<string, MessageThread>;
  messages: Record<string, Message>;
  reviews: Record<string, Review>;
  payments: Record<string, Payment>;
  payoutMethods: Record<string, PayoutMethod>;
  disputes: Record<string, Dispute>;
  verifications: Record<string, Verification>;
}

export type EntityKey = keyof Entities;

export interface AppState {
  /** Bumped whenever the shape changes; a persisted blob with a different
      version is discarded rather than migrated. */
  version: 1;
  session: {
    role: Role;
    customerId: string;
    providerId: string;
  };
  entities: Entities;
  order: Record<EntityKey, string[]>;
  ui: {
    favorites: string[];
    requestDraft: RequestDraft | null;
    unreadByThread: Record<string, number>;
    /** Id counters, so generated ids are readable and replayable. */
    counters: Record<string, number>;
  };
}
