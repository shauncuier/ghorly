import "server-only";

import type { AppState, Entities, EntityKey } from "@/lib/store/types";
import type { Session } from "@/lib/auth/types";

/**
 * Cuts the full state down to what one signed-in actor is allowed to see.
 *
 * The previous `/api/bootstrap` returned everything to anyone — every
 * customer's phone and email, every payment, every dispute. This is the fix.
 * The client still receives one snapshot shaped like `AppState`, so the forty
 * selector hooks are unchanged; they just get a smaller graph.
 *
 * Rule of thumb applied below: the service catalogue is public, people's
 * contact details are not, and money is visible only to its two parties.
 */

/** Categories and areas are the public catalogue — safe for everyone. */
const PUBLIC_COLLECTIONS: EntityKey[] = ["categories", "areas"];

function pick<T>(source: Record<string, T>, ids: Iterable<string>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const id of ids) {
    const row = source[id];
    if (row) out[id] = row;
  }
  return out;
}

function orderOf(order: string[], allowed: Record<string, unknown>): string[] {
  return order.filter((id) => id in allowed);
}

/**
 * Providers are public, but their phone number is not — it is only useful to
 * someone with a confirmed booking, and publishing it invites scraping.
 */
function redactProvider<T extends { phone: string }>(provider: T): T {
  return { ...provider, phone: "" };
}

/** Customers are never public. Counterparties see a name and nothing else. */
function minimalCustomer<T extends { _id: string; bnName: string }>(customer: T) {
  return {
    _id: customer._id,
    bnName: customer.bnName,
    phone: "",
    email: "",
    areaId: "",
    addressIds: [],
    status: "active" as const,
    bookingCount: 0,
    createdAt: "",
    updatedAt: "",
  };
}

export function scopeStateForSession(full: AppState, session: Session | null): AppState {
  // Signed out: the public catalogue and provider profiles only. Enough to
  // render the marketing site, nothing about any person.
  if (!session) {
    return buildScope(full, null, {
      providers: Object.keys(full.entities.providers),
      customers: [],
      addresses: [],
      requests: [],
      quotes: [],
      bookings: [],
      threads: [],
      messages: [],
      reviews: Object.keys(full.entities.reviews),
      payments: [],
      payoutMethods: [],
      disputes: [],
      verifications: [],
    });
  }

  // Admins run the platform; they legitimately need the whole graph — but not
  // the seed's identity or the demo user's personal UI state.
  if (session.roles.includes("admin")) {
    return {
      ...full,
      session: {
        role: session.activeRole,
        customerId: session.customerId ?? "",
        providerId: session.providerId ?? "",
      },
      ui: {
        ...full.ui,
        favorites: [],
        requestDraft: null,
        unreadByThread: {},
      },
    };
  }

  const { customerId, providerId } = session;

  const requests = Object.values(full.entities.requests).filter((r) => {
    if (customerId && r.customerId === customerId) return true;
    if (!providerId) return false;
    // A provider sees open requests they could quote on, plus any they have
    // already engaged with.
    const provider = full.entities.providers[providerId];
    if (!provider) return false;
    const engaged = r.quoteIds.some(
      (qid) => full.entities.quotes[qid]?.providerId === providerId,
    );
    if (engaged) return true;
    return (
      r.status === "open" &&
      provider.activeCategoryIds.includes(r.categoryId) &&
      (provider.areaId === r.areaId || provider.serviceAreaIds.includes(r.areaId))
    );
  });

  const quotes = Object.values(full.entities.quotes).filter(
    (q) =>
      (customerId && q.customerId === customerId) ||
      (providerId && q.providerId === providerId),
  );

  const bookings = Object.values(full.entities.bookings).filter(
    (b) =>
      (customerId && b.customerId === customerId) ||
      (providerId && b.providerId === providerId),
  );

  const threads = Object.values(full.entities.threads).filter(
    (t) =>
      (customerId && t.customerId === customerId) ||
      (providerId && t.providerId === providerId),
  );

  const messages = threads.flatMap((t) => t.messageIds);

  const payments = Object.values(full.entities.payments).filter(
    (p) =>
      (customerId && p.customerId === customerId) ||
      (providerId && p.providerId === providerId),
  );

  const addresses = Object.values(full.entities.addresses).filter((a) => {
    if (customerId && a.customerId === customerId) return true;
    // A provider needs the address of a job they are actually assigned to.
    return bookings.some((b) => b.addressId === a._id && b.providerId === providerId);
  });

  const payoutMethods = Object.values(full.entities.payoutMethods).filter(
    (m) => m.ownerId === customerId || m.ownerId === providerId,
  );

  const disputes = Object.values(full.entities.disputes).filter((d) =>
    bookings.some((b) => b._id === d.bookingId),
  );

  // Only your own verification record — others' document status is private.
  const verifications = Object.values(full.entities.verifications).filter(
    (v) => providerId && v.providerId === providerId,
  );

  // Counterparties: people you share a request, booking or thread with.
  const counterpartCustomerIds = new Set<string>();
  if (customerId) counterpartCustomerIds.add(customerId);
  for (const r of requests) counterpartCustomerIds.add(r.customerId);
  for (const b of bookings) counterpartCustomerIds.add(b.customerId);
  for (const t of threads) counterpartCustomerIds.add(t.customerId);

  return buildScope(
    full,
    session,
    {
      providers: Object.keys(full.entities.providers),
      customers: [...counterpartCustomerIds],
      addresses: addresses.map((a) => a._id),
      requests: requests.map((r) => r._id),
      quotes: quotes.map((q) => q._id),
      bookings: bookings.map((b) => b._id),
      threads: threads.map((t) => t._id),
      messages,
      reviews: Object.keys(full.entities.reviews),
      payments: payments.map((p) => p._id),
      payoutMethods: payoutMethods.map((m) => m._id),
      disputes: disputes.map((d) => d._id),
      verifications: verifications.map((v) => v._id),
    },
    customerId,
  );
}

function buildScope(
  full: AppState,
  session: Session | null,
  ids: Record<Exclude<EntityKey, "categories" | "areas">, string[]>,
  selfCustomerId?: string | null,
): AppState {
  const entities = {} as Entities;
  const order = {} as Record<EntityKey, string[]>;

  for (const name of PUBLIC_COLLECTIONS) {
    entities[name] = full.entities[name] as never;
    order[name] = full.order[name];
  }

  // Providers are public but phone-redacted.
  const providers: Record<string, (typeof full.entities.providers)[string]> = {};
  for (const id of ids.providers) {
    const p = full.entities.providers[id];
    if (p) providers[id] = redactProvider(p);
  }
  entities.providers = providers;
  order.providers = orderOf(full.order.providers, providers);

  // Your own customer record is full; everyone else's is name-only.
  const customers: Record<string, (typeof full.entities.customers)[string]> = {};
  for (const id of ids.customers) {
    const c = full.entities.customers[id];
    if (!c) continue;
    customers[id] = id === selfCustomerId ? c : (minimalCustomer(c) as typeof c);
  }
  entities.customers = customers;
  order.customers = orderOf(full.order.customers, customers);

  const rest: Exclude<EntityKey, "categories" | "areas" | "providers" | "customers">[] = [
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

  for (const name of rest) {
    const allowed = pick(full.entities[name] as Record<string, unknown>, ids[name]);
    entities[name] = allowed as never;
    order[name] = orderOf(full.order[name], allowed);
  }

  return {
    version: 1,
    // Identity comes from the verified cookie. Passing `full.session` through
    // shipped the seed's demo ids (`cus-0001` / `prv-0001`) to every caller,
    // including a real signed-in user — and handed a customer-only account a
    // provider id it has no claim to.
    session: session
      ? {
          role: session.activeRole,
          customerId: session.customerId ?? "",
          providerId: session.providerId ?? "",
        }
      : { role: "guest", customerId: "", providerId: "" },
    entities,
    order,
    ui: {
      ...full.ui,
      // Per-person UI state is not stored server-side, so a real session must
      // start clean rather than inheriting the seed's. The favourites were the
      // demo user's; the unread count pointed at a thread outside this
      // session's scope, which is why the badge showed a message that could
      // never be opened or cleared.
      favorites: session ? [] : full.ui.favorites,
      requestDraft: null,
      unreadByThread: Object.fromEntries(
        Object.entries(full.ui.unreadByThread).filter(
          ([threadId]) => threadId in (entities.threads ?? {}),
        ),
      ),
    },
  };
}
