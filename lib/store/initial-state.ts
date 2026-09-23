import type { AppState, Entities, EntityKey } from "@/lib/store/types";
import { CATEGORIES } from "@/lib/data/categories";
import { AREAS } from "@/lib/data/areas";
import { PROVIDERS } from "@/lib/data/providers";
import { CUSTOMERS, ADDRESSES, DEMO_CUSTOMER_ID } from "@/lib/data/customers";
import { REVIEWS } from "@/lib/data/reviews";
import {
  BOOKINGS,
  DEMO_PROVIDER_ID,
  DISPUTES,
  MESSAGES,
  PAYMENTS,
  PAYOUT_METHODS,
  QUOTES,
  REQUESTS,
  THREADS,
  VERIFICATIONS,
} from "@/lib/data/marketplace";

function index<T extends { _id: string }>(rows: T[]): [Record<string, T>, string[]] {
  const byId: Record<string, T> = {};
  const order: string[] = [];
  for (const row of rows) {
    byId[row._id] = row;
    order.push(row._id);
  }
  return [byId, order];
}

/**
 * Builds the seed state.
 *
 * Must be **fully deterministic** — this runs on the server to produce the
 * initial HTML and again in the browser for the first client render. Any
 * divergence between the two is a hydration error. Nothing here may call
 * `Math.random()`, `Date.now()` or read `localStorage`; persisted state is
 * applied later, via a `HYDRATE` dispatch after mount.
 */
export function buildInitialState(): AppState {
  const [categories, categoryOrder] = index(CATEGORIES);
  const [areas, areaOrder] = index(AREAS);
  const [providers, providerOrder] = index(PROVIDERS);
  const [customers, customerOrder] = index(CUSTOMERS);
  const [addresses, addressOrder] = index(ADDRESSES);
  const [requests, requestOrder] = index(REQUESTS);
  const [quotes, quoteOrder] = index(QUOTES);
  const [bookings, bookingOrder] = index(BOOKINGS);
  const [threads, threadOrder] = index(THREADS);
  const [messages, messageOrder] = index(MESSAGES);
  const [reviews, reviewOrder] = index(REVIEWS);
  const [payments, paymentOrder] = index(PAYMENTS);
  const [payoutMethods, payoutOrder] = index(PAYOUT_METHODS);
  const [disputes, disputeOrder] = index(DISPUTES);
  const [verifications, verificationOrder] = index(VERIFICATIONS);

  const entities: Entities = {
    categories,
    areas,
    providers,
    customers,
    addresses,
    requests,
    quotes,
    bookings,
    threads,
    messages,
    reviews,
    payments,
    payoutMethods,
    disputes,
    verifications,
  };

  const order: Record<EntityKey, string[]> = {
    categories: categoryOrder,
    areas: areaOrder,
    providers: providerOrder,
    customers: customerOrder,
    addresses: addressOrder,
    requests: requestOrder,
    quotes: quoteOrder,
    bookings: bookingOrder,
    threads: threadOrder,
    messages: messageOrder,
    reviews: reviewOrder,
    payments: paymentOrder,
    payoutMethods: payoutOrder,
    disputes: disputeOrder,
    verifications: verificationOrder,
  };

  return {
    version: 1,
    session: {
      role: "customer",
      customerId: DEMO_CUSTOMER_ID,
      providerId: DEMO_PROVIDER_ID,
    },
    entities,
    order,
    ui: {
      // Two providers pre-favourited so the favourites page isn't empty on a
      // first look — the empty state is still reachable by un-favouriting.
      favorites: [PROVIDERS[0]._id, PROVIDERS[4]._id],
      requestDraft: null,
      unreadByThread: { [THREADS[0]?._id ?? "thr-0001"]: 1 },
      counters: {
        req: REQUESTS.length,
        quo: QUOTES.length,
        bkg: BOOKINGS.length,
        pay: PAYMENTS.length,
        thr: THREADS.length,
        msg: MESSAGES.length,
        rev: REVIEWS.length,
        adr: ADDRESSES.length,
        pom: PAYOUT_METHODS.length,
        dsp: DISPUTES.length,
      },
    },
  };
}

/**
 * `nextId('bkg', counters)` → `'bkg-0042-k3f9q2'`.
 *
 * The number keeps ids readable and roughly ordered; the random suffix makes
 * them unique. Counter-only ids collided the moment two people wrote at once —
 * e.g. an admin's reply arriving live while the customer's browser, holding an
 * older counter, minted the same `msg-00NN` for its own next message.
 */
export function nextId(prefix: string, counters: Record<string, number>): string {
  const n = (counters[prefix] ?? 0) + 1;
  return `${prefix}-${String(n).padStart(4, "0")}-${randomSuffix()}`;
}

function randomSuffix(): string {
  const bytes = new Uint8Array(4);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 6);
}

/**
 * An empty state with the same shape as the seed, and no data in it.
 *
 * This is what the store starts from in the browser, and therefore what the
 * server renders into the HTML. It exists because the seed does not belong in
 * a signed-in user's page: rendering `buildInitialState()` on the server put
 * the *demo* customer's name and request titles into every dashboard's markup,
 * for whoever was signed in, until the client replaced them a moment later.
 *
 * With no entities, every `QueryResult` reports `isLoading` on the first pass,
 * so dashboards server-render their skeletons and fill in from
 * `/api/bootstrap` once the real, session-scoped snapshot arrives. The
 * skeletons and the envelope already existed for exactly this.
 *
 * Deterministic, like the seed — same output on the server and on the first
 * client render, so it cannot cause a hydration mismatch.
 */
export function buildEmptyState(): AppState {
  const entities = {} as Entities;
  const order = {} as Record<EntityKey, string[]>;

  const keys: EntityKey[] = [
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

  for (const key of keys) {
    entities[key] = {} as never;
    order[key] = [];
  }

  return {
    version: 1,
    session: { role: "guest", customerId: "", providerId: "" },
    entities,
    order,
    ui: {
      favorites: [],
      requestDraft: null,
      unreadByThread: {},
      counters: {
        req: 0, quo: 0, bkg: 0, pay: 0, thr: 0,
        msg: 0, rev: 0, adr: 0, pom: 0, dsp: 0,
      },
    },
  };
}
