"use client";

import { useMemo } from "react";
import {
  useAppState,
  useDataSource as useStoreDataSource,
  useServerSession as useStoreServerSession,
} from "@/lib/store/context";
import type { DataSource, ServerSession } from "@/lib/store/context";
import { ready, missing, type QueryResult } from "@/lib/api/types";
import type {
  Address,
  Area,
  Booking,
  BookingStatus,
  Category,
  Customer,
  Dispute,
  Message,
  MessageThread,
  Payment,
  Provider,
  Quote,
  RequestDraft,
  Review,
  Role,
  ServiceRequest,
  Verification,
} from "@/lib/types";

/**
 * Every read in the app goes through this file.
 *
 * These select synchronously from one in-memory snapshot, which `StoreProvider`
 * now fetches from MongoDB via `GET /api/bootstrap` and refreshes after every
 * mutation. That is why the migration from mock data to a real database
 * touched no component: the hooks below, and the `QueryResult` envelope they
 * return, never changed shape.
 *
 * Nothing under `components/` imports from `lib/store/` — keeping that true is
 * what leaves the data layer swappable.
 */

/* ==========================================================================
   Connection
   ========================================================================== */

/**
 * Where the data on screen came from: the database, the offline seed, or
 * still loading. Surfaced through `lib/api` like everything else so no
 * component has to reach into `lib/store` directly.
 */
export function useDataSource(): DataSource {
  return useStoreDataSource();
}

export type { DataSource };

/**
 * The identity the server verified from the session cookie, or null when
 * signed out. This — not `useSession()` below — is the authority on who the
 * user is and which roles they hold.
 */
export function useServerSession(): ServerSession | null {
  return useStoreServerSession();
}

export type { ServerSession };

/** True when the signed-in account actually holds this role. */
export function useHasRole(role: "customer" | "provider" | "admin"): boolean {
  const session = useStoreServerSession();
  return Boolean(session?.roles.includes(role));
}

/* ==========================================================================
   Session
   ========================================================================== */

export function useSession(): {
  role: Role;
  customerId: string;
  providerId: string;
} {
  return useAppState().session;
}

export function useCurrentCustomer(): QueryResult<Customer> {
  const state = useAppState();
  const customer = state.entities.customers[state.session.customerId];
  return customer ? ready(customer) : missing<Customer>("গ্রাহক খুঁজে পাওয়া যায়নি");
}

export function useCurrentProvider(): QueryResult<Provider> {
  const state = useAppState();
  const provider = state.entities.providers[state.session.providerId];
  return provider ? ready(provider) : missing<Provider>("পেশাদার খুঁজে পাওয়া যায়নি");
}

/* ==========================================================================
   Taxonomy
   ========================================================================== */

export function useCategories(): QueryResult<Category[]> {
  const state = useAppState();
  const rows = useMemo(
    () => state.order.categories.map((id) => state.entities.categories[id]),
    [state.order.categories, state.entities.categories],
  );
  return ready(rows);
}

export function useCategoryById(id: string | null | undefined): QueryResult<Category> {
  const state = useAppState();
  if (!id) return missing<Category>();
  const row = state.entities.categories[id];
  return row ? ready(row) : missing<Category>();
}

export function useAreas(): QueryResult<Area[]> {
  const state = useAppState();
  const rows = useMemo(
    () => state.order.areas.map((id) => state.entities.areas[id]),
    [state.order.areas, state.entities.areas],
  );
  return ready(rows);
}

export function useAreaById(id: string | null | undefined): QueryResult<Area> {
  const state = useAppState();
  if (!id) return missing<Area>();
  const row = state.entities.areas[id];
  return row ? ready(row) : missing<Area>();
}

/* ==========================================================================
   Providers
   ========================================================================== */

export interface ProviderFilter {
  categoryId?: string | null;
  areaId?: string | null;
  minRating?: number;
  maxPrice?: number;
  verifiedOnly?: boolean;
  query?: string;
  sort?: "rating" | "price" | "jobs" | "response";
}

export function useProviders(filter: ProviderFilter = {}): QueryResult<Provider[]> {
  const state = useAppState();
  const { categoryId, areaId, minRating, maxPrice, verifiedOnly, query, sort } = filter;

  const rows = useMemo(() => {
    let list = state.order.providers
      .map((id) => state.entities.providers[id])
      .filter((p) => p.status === "active");

    if (categoryId) list = list.filter((p) => p.activeCategoryIds.includes(categoryId));
    if (areaId)
      list = list.filter((p) => p.areaId === areaId || p.serviceAreaIds.includes(areaId));
    if (minRating) list = list.filter((p) => p.rating >= minRating);
    if (maxPrice) list = list.filter((p) => p.priceFrom <= maxPrice);
    if (verifiedOnly) list = list.filter((p) => p.isVerified);
    if (query?.trim()) {
      const q = query.trim();
      list = list.filter(
        (p) => p.bnName.includes(q) || p.bnTitle.includes(q) || p.bnBio.includes(q),
      );
    }

    switch (sort) {
      case "price":
        return [...list].sort((a, b) => a.priceFrom - b.priceFrom);
      case "jobs":
        return [...list].sort((a, b) => b.completedJobs - a.completedJobs);
      case "response":
        return [...list].sort((a, b) => a.responseMinutes - b.responseMinutes);
      case "rating":
      default:
        return [...list].sort((a, b) => b.rating - a.rating);
    }
  }, [
    state.order.providers,
    state.entities.providers,
    categoryId,
    areaId,
    minRating,
    maxPrice,
    verifiedOnly,
    query,
    sort,
  ]);

  return ready(rows);
}

export function useProviderById(id: string | null | undefined): QueryResult<Provider> {
  const state = useAppState();
  if (!id) return missing<Provider>();
  const row = state.entities.providers[id];
  return row ? ready(row) : missing<Provider>("পেশাদার খুঁজে পাওয়া যায়নি");
}

export function useAllProviders(): QueryResult<Provider[]> {
  const state = useAppState();
  const rows = useMemo(
    () => state.order.providers.map((id) => state.entities.providers[id]),
    [state.order.providers, state.entities.providers],
  );
  return ready(rows);
}

export function useFavorites(): QueryResult<Provider[]> {
  const state = useAppState();
  const rows = useMemo(
    () =>
      state.ui.favorites
        .map((id) => state.entities.providers[id])
        .filter((p): p is Provider => Boolean(p)),
    [state.ui.favorites, state.entities.providers],
  );
  return ready(rows);
}

export function useIsFavorite(providerId: string): boolean {
  return useAppState().ui.favorites.includes(providerId);
}

/* ==========================================================================
   Customers
   ========================================================================== */

export function useCustomers(): QueryResult<Customer[]> {
  const state = useAppState();
  const rows = useMemo(
    () => state.order.customers.map((id) => state.entities.customers[id]),
    [state.order.customers, state.entities.customers],
  );
  return ready(rows);
}

export function useCustomerById(id: string | null | undefined): QueryResult<Customer> {
  const state = useAppState();
  if (!id) return missing<Customer>();
  const row = state.entities.customers[id];
  return row ? ready(row) : missing<Customer>();
}

export function useAddresses(customerId?: string): QueryResult<Address[]> {
  const state = useAppState();
  const owner = customerId ?? state.session.customerId;
  const rows = useMemo(
    () =>
      state.order.addresses
        .map((id) => state.entities.addresses[id])
        .filter((a) => a.customerId === owner),
    [state.order.addresses, state.entities.addresses, owner],
  );
  return ready(rows);
}

/* ==========================================================================
   Requests & quotes
   ========================================================================== */

export function useCustomerRequests(): QueryResult<ServiceRequest[]> {
  const state = useAppState();
  const owner = state.session.customerId;
  const rows = useMemo(
    () =>
      state.order.requests
        .map((id) => state.entities.requests[id])
        .filter((r) => r.customerId === owner)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.order.requests, state.entities.requests, owner],
  );
  return ready(rows);
}

export function useAllRequests(): QueryResult<ServiceRequest[]> {
  const state = useAppState();
  const rows = useMemo(
    () =>
      state.order.requests
        .map((id) => state.entities.requests[id])
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.order.requests, state.entities.requests],
  );
  return ready(rows);
}

export function useRequestById(id: string | null | undefined): QueryResult<ServiceRequest> {
  const state = useAppState();
  if (!id) return missing<ServiceRequest>();
  const row = state.entities.requests[id];
  return row ? ready(row) : missing<ServiceRequest>();
}

/**
 * The admin's dispatch queue: requests waiting for the team to find a
 * professional and send a quotation, oldest first so nobody waits longest.
 */
export function useRequestsAwaitingQuote(): QueryResult<ServiceRequest[]> {
  const state = useAppState();
  const rows = useMemo(
    () =>
      state.order.requests
        .map((id) => state.entities.requests[id])
        .filter((r) => r.status === "open")
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [state.order.requests, state.entities.requests],
  );
  return ready(rows);
}

/** The quotation currently awaiting the customer's answer, if any. */
export function useLiveQuoteForRequest(requestId: string | null): QueryResult<Quote | null> {
  const state = useAppState();
  const row = useMemo(() => {
    const request = requestId ? state.entities.requests[requestId] : undefined;
    if (!request) return null;
    for (let i = request.quoteIds.length - 1; i >= 0; i -= 1) {
      const q = state.entities.quotes[request.quoteIds[i]];
      if (q?.status === "sent" || q?.status === "accepted") return q;
    }
    return null;
  }, [state.entities.requests, state.entities.quotes, requestId]);
  return ready(row);
}

export function useQuotesForRequest(requestId: string | null): QueryResult<Quote[]> {
  const state = useAppState();
  const rows = useMemo(() => {
    if (!requestId) return [];
    return state.order.quotes
      .map((id) => state.entities.quotes[id])
      .filter((q) => q.requestId === requestId);
  }, [state.order.quotes, state.entities.quotes, requestId]);
  return ready(rows);
}

export function useCustomerQuotes(): QueryResult<Quote[]> {
  const state = useAppState();
  const owner = state.session.customerId;
  const rows = useMemo(
    () =>
      state.order.quotes
        .map((id) => state.entities.quotes[id])
        .filter((q) => q.customerId === owner)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.order.quotes, state.entities.quotes, owner],
  );
  return ready(rows);
}

export function useQuoteById(id: string | null | undefined): QueryResult<Quote> {
  const state = useAppState();
  if (!id) return missing<Quote>();
  const row = state.entities.quotes[id];
  return row ? ready(row) : missing<Quote>();
}

/* ==========================================================================
   Bookings
   ========================================================================== */

function sortByScheduled(a: Booking, b: Booking) {
  return `${b.scheduledDate}`.localeCompare(`${a.scheduledDate}`);
}

export function useCustomerBookings(status?: BookingStatus[]): QueryResult<Booking[]> {
  const state = useAppState();
  const owner = state.session.customerId;
  const key = status?.join(",");

  const rows = useMemo(() => {
    let list = state.order.bookings
      .map((id) => state.entities.bookings[id])
      .filter((b) => b.customerId === owner);
    if (key) list = list.filter((b) => key.split(",").includes(b.status));
    return list.sort(sortByScheduled);
  }, [state.order.bookings, state.entities.bookings, owner, key]);

  return ready(rows);
}

export function useProviderBookings(status?: BookingStatus[]): QueryResult<Booking[]> {
  const state = useAppState();
  const owner = state.session.providerId;
  const key = status?.join(",");

  const rows = useMemo(() => {
    let list = state.order.bookings
      .map((id) => state.entities.bookings[id])
      .filter((b) => b.providerId === owner);
    if (key) list = list.filter((b) => key.split(",").includes(b.status));
    return list.sort(sortByScheduled);
  }, [state.order.bookings, state.entities.bookings, owner, key]);

  return ready(rows);
}

export function useAllBookings(): QueryResult<Booking[]> {
  const state = useAppState();
  const rows = useMemo(
    () => state.order.bookings.map((id) => state.entities.bookings[id]).sort(sortByScheduled),
    [state.order.bookings, state.entities.bookings],
  );
  return ready(rows);
}

export function useBookingById(id: string | null | undefined): QueryResult<Booking> {
  const state = useAppState();
  if (!id) return missing<Booking>();
  const row = state.entities.bookings[id];
  return row ? ready(row) : missing<Booking>("বুকিং খুঁজে পাওয়া যায়নি");
}

/* ==========================================================================
   Reviews
   ========================================================================== */

export function useReviewsForProvider(providerId: string | null): QueryResult<Review[]> {
  const state = useAppState();
  const rows = useMemo(() => {
    if (!providerId) return [];
    return state.order.reviews
      .map((id) => state.entities.reviews[id])
      .filter((r) => r.providerId === providerId && !r.isHidden)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.order.reviews, state.entities.reviews, providerId]);
  return ready(rows);
}

export function useCustomerReviews(): QueryResult<Review[]> {
  const state = useAppState();
  const owner = state.session.customerId;
  const rows = useMemo(
    () =>
      state.order.reviews
        .map((id) => state.entities.reviews[id])
        .filter((r) => r.customerId === owner)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.order.reviews, state.entities.reviews, owner],
  );
  return ready(rows);
}

export function useAllReviews(): QueryResult<Review[]> {
  const state = useAppState();
  const rows = useMemo(
    () =>
      state.order.reviews
        .map((id) => state.entities.reviews[id])
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.order.reviews, state.entities.reviews],
  );
  return ready(rows);
}

/* ==========================================================================
   Payments
   ========================================================================== */

export function useCustomerPayments(): QueryResult<Payment[]> {
  const state = useAppState();
  const owner = state.session.customerId;
  const rows = useMemo(
    () =>
      state.order.payments
        .map((id) => state.entities.payments[id])
        .filter((p) => p.customerId === owner)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.order.payments, state.entities.payments, owner],
  );
  return ready(rows);
}

export function useProviderPayments(): QueryResult<Payment[]> {
  const state = useAppState();
  const owner = state.session.providerId;
  const rows = useMemo(
    () =>
      state.order.payments
        .map((id) => state.entities.payments[id])
        .filter((p) => p.providerId === owner)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.order.payments, state.entities.payments, owner],
  );
  return ready(rows);
}

export function useAllPayments(): QueryResult<Payment[]> {
  const state = useAppState();
  const rows = useMemo(
    () =>
      state.order.payments
        .map((id) => state.entities.payments[id])
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.order.payments, state.entities.payments],
  );
  return ready(rows);
}

/* ==========================================================================
   Messaging
   ========================================================================== */

/**
 * Support threads the session can see. A customer or provider has at most one
 * (theirs, with the Ghorly team); the admin sees every conversation.
 */
export function useThreads(as: "customer" | "provider" | "admin"): QueryResult<MessageThread[]> {
  const state = useAppState();
  const owner = as === "customer" ? state.session.customerId : state.session.providerId;
  const rows = useMemo(
    () =>
      state.order.threads
        .map((id) => state.entities.threads[id])
        .filter(
          (t) =>
            as === "admin" ||
            (t.kind === as && (as === "customer" ? t.customerId : t.providerId) === owner),
        )
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)),
    [state.order.threads, state.entities.threads, as, owner],
  );
  return ready(rows);
}

export function useThreadById(id: string | null | undefined): QueryResult<MessageThread> {
  const state = useAppState();
  if (!id) return missing<MessageThread>();
  const row = state.entities.threads[id];
  return row ? ready(row) : missing<MessageThread>();
}

export function useMessages(threadId: string | null | undefined): QueryResult<Message[]> {
  const state = useAppState();
  const rows = useMemo(() => {
    if (!threadId) return [];
    const thread = state.entities.threads[threadId];
    if (!thread) return [];
    return thread.messageIds
      .map((id) => state.entities.messages[id])
      .filter((m): m is Message => Boolean(m));
  }, [state.entities.threads, state.entities.messages, threadId]);
  return ready(rows);
}

export function useUnreadCount(): number {
  const state = useAppState();
  return Object.values(state.ui.unreadByThread).reduce((a, b) => a + b, 0);
}

/* ==========================================================================
   Trust & safety
   ========================================================================== */

export function useVerifications(): QueryResult<Verification[]> {
  const state = useAppState();
  const rows = useMemo(
    () => state.order.verifications.map((id) => state.entities.verifications[id]),
    [state.order.verifications, state.entities.verifications],
  );
  return ready(rows);
}

export function useProviderVerification(): QueryResult<Verification> {
  const state = useAppState();
  const owner = state.session.providerId;
  const row = Object.values(state.entities.verifications).find(
    (v) => v.providerId === owner,
  );
  return row ? ready(row) : missing<Verification>();
}

export function useDisputes(): QueryResult<Dispute[]> {
  const state = useAppState();
  const rows = useMemo(
    () =>
      state.order.disputes
        .map((id) => state.entities.disputes[id])
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.order.disputes, state.entities.disputes],
  );
  return ready(rows);
}

/* ==========================================================================
   Wizard draft
   ========================================================================== */

export function useRequestDraft(): RequestDraft | null {
  return useAppState().ui.requestDraft;
}

/* ==========================================================================
   Derived figures
   ========================================================================== */

export function useProviderEarnings(): QueryResult<{
  paid: number;
  pending: number;
  commission: number;
  thisMonth: number;
  completedCount: number;
}> {
  const state = useAppState();
  const owner = state.session.providerId;

  const summary = useMemo(() => {
    const rows = state.order.payments
      .map((id) => state.entities.payments[id])
      .filter((p) => p.providerId === owner);

    const paid = rows.filter((p) => p.status === "paid");
    const month = "2026-03";

    return {
      paid: paid.reduce((s, p) => s + (p.amount - p.commission), 0),
      pending: rows
        .filter((p) => p.status === "pending")
        .reduce((s, p) => s + (p.amount - p.commission), 0),
      commission: paid.reduce((s, p) => s + p.commission, 0),
      thisMonth: paid
        .filter((p) => p.paidAt?.startsWith(month))
        .reduce((s, p) => s + (p.amount - p.commission), 0),
      completedCount: paid.length,
    };
  }, [state.order.payments, state.entities.payments, owner]);

  return ready(summary);
}
