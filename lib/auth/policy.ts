import type { Action } from "@/lib/store/actions";
import type { AppState } from "@/lib/store/types";
import type { Session } from "@/lib/auth/types";
import { supportThreadFor, threadParty, type SupportKind } from "@/lib/store/support";

/**
 * Who may do what, to which record.
 *
 * Authentication only answers "who are you". This answers "and are you allowed
 * to do *that* to *this*" — which is the question that actually protects the
 * data. Every action is listed explicitly and the default is `deny`, so a new
 * action added to the reducer is refused until somebody decides who owns it.
 *
 * Ownership is checked against the current state rather than trusted from the
 * request: a caller can claim any `bookingId`, so we look it up and compare.
 */

export interface Decision {
  allow: boolean;
  /** Bangla, shown to the user. Deliberately vague about *why* for others' records. */
  reason?: string;
}

const ALLOW: Decision = { allow: true };
const DENY = (reason = "এই কাজটি করার অনুমতি নেই।"): Decision => ({ allow: false, reason });

function isAdmin(s: Session) {
  return s.roles.includes("admin");
}

type EntityKey = keyof AppState["entities"];

/**
 * The records an action creates, with the ids the client chose for them.
 *
 * Ids are generated in the browser so an optimistic update can navigate to
 * the new record straight away. But the reducer's `addEntity` writes
 * `entities[key][id] = …` and the repository upserts it, so an id that is
 * already taken would *replace* that record — somebody else's address, quote
 * or message. A create must therefore name an id nobody has.
 */
function createdIds(action: Action, state: AppState): [EntityKey, string][] {
  /**
   * A support thread id only creates something when the party has no thread
   * yet; otherwise the reducer posts into the existing one and ignores it.
   */
  const newThread = (kind: SupportKind, partyId: string | null | undefined, threadId: string) =>
    partyId && !supportThreadFor(state.entities, kind, partyId)
      ? ([["threads", threadId]] as [EntityKey, string][])
      : [];

  switch (action.type) {
    case "SUBMIT_REQUEST":
      return [["requests", action.requestId]];
    case "ACCEPT_QUOTE": {
      const quote = state.entities.quotes[action.quoteId];
      return [
        ["bookings", action.bookingId],
        ["payments", action.paymentId],
        ["messages", action.messageId],
        ...newThread("provider", quote?.providerId, action.threadId),
      ];
    }
    case "SUBMIT_REVIEW":
      return [["reviews", action.reviewId]];
    case "ADD_ADDRESS":
      return [["addresses", action.address._id]];
    case "ADD_PAYOUT_METHOD":
      return [["payoutMethods", action.id]];
    case "SEND_QUOTATION": {
      const request = state.entities.requests[action.requestId];
      return [
        ["quotes", action.quoteId],
        ["messages", action.messageId],
        ...newThread("customer", request?.customerId, action.threadId),
      ];
    }
    case "SEND_MESSAGE":
      return [["messages", action.messageId]];
    default:
      return [];
  }
}

export function authorize(
  session: Session | null,
  action: Action,
  state: AppState,
): Decision {
  if (!session) return DENY("লগ ইন করুন।");

  for (const [key, id] of createdIds(action, state)) {
    if (state.entities[key][id]) {
      // Usually a stale id counter in this browser, not an attack — the client
      // refreshes on any rejection, which brings its counters up to date.
      return DENY("তথ্য হালনাগাদ হয়েছে। আবার চেষ্টা করুন।");
    }
  }

  const customerId = session.customerId;
  const providerId = session.providerId;

  /** Does this session own the customer side of a record? */
  const ownsCustomer = (id: string | null | undefined) =>
    Boolean(customerId && id && customerId === id);
  const ownsProvider = (id: string | null | undefined) =>
    Boolean(providerId && id && providerId === id);

  switch (action.type) {
    /* ---------------- session-local, no server authority needed ---------------- */

    case "SET_ROLE":
      // You may only switch to a role you actually hold.
      return session.roles.includes(action.role)
        ? ALLOW
        : DENY("এই ভূমিকায় প্রবেশের অনুমতি নেই।");

    case "LOGOUT":
    case "DRAFT_START":
    case "DRAFT_PATCH":
    case "DRAFT_SET_STEP":
    case "DRAFT_RESET":
    case "TOGGLE_FAVORITE":
    case "MARK_THREAD_READ":
      return ALLOW;

    // Wiping the dataset is a demo affordance, never a production one. It
    // replaces every collection with the seed, so on any server with a real
    // database it needs an admin *and* an explicit opt-in — "not production"
    // alone would let any signed-in user wipe a staging database.
    case "RESET_DEMO":
      return process.env.NODE_ENV !== "production" &&
        process.env.ALLOW_DEMO_RESET === "true" &&
        isAdmin(session)
        ? ALLOW
        : DENY("এই কাজটি শুধু ডেভেলপমেন্টে সম্ভব।");

    // Carries a whole client state; the API rejects it before reaching here.
    case "HYDRATE":
      return DENY();

    /* ---------------- customer ---------------- */

    case "SUBMIT_REQUEST":
      return customerId ? ALLOW : DENY("গ্রাহক হিসেবে লগ ইন করুন।");

    case "CANCEL_REQUEST": {
      const request = state.entities.requests[action.requestId];
      if (!request) return DENY("অনুরোধটি খুঁজে পাওয়া যায়নি।");
      return ownsCustomer(request.customerId) || isAdmin(session) ? ALLOW : DENY();
    }

    case "ACCEPT_QUOTE":
    case "DECLINE_QUOTE": {
      const quote = state.entities.quotes[action.quoteId];
      if (!quote) return DENY("কোটেশনটি খুঁজে পাওয়া যায়নি।");
      if (!ownsCustomer(quote.customerId) && !isAdmin(session)) return DENY();
      // Only the live quotation can be answered — not one the team replaced.
      return quote.status === "sent" ? ALLOW : DENY("এই কোটেশন আর খোলা নেই।");
    }

    case "CONFIRM_BOOKING":
    case "CANCEL_BOOKING":
    case "RESCHEDULE_BOOKING": {
      const booking = state.entities.bookings[action.bookingId];
      if (!booking) return DENY("বুকিংটি খুঁজে পাওয়া যায়নি।");
      // A provider may cancel or reschedule their own job too.
      const mine =
        ownsCustomer(booking.customerId) ||
        (action.type !== "CONFIRM_BOOKING" && ownsProvider(booking.providerId));
      return mine || isAdmin(session) ? ALLOW : DENY();
    }

    case "SUBMIT_REVIEW": {
      const booking = state.entities.bookings[action.bookingId];
      if (!booking) return DENY("বুকিংটি খুঁজে পাওয়া যায়নি।");
      if (!ownsCustomer(booking.customerId) && !isAdmin(session)) return DENY();
      if (booking.status !== "completed")
        return DENY("কাজ সম্পন্ন হওয়ার পরেই রিভিউ দেওয়া যায়।");
      if (booking.reviewId) return DENY("এই কাজের রিভিউ আগেই দেওয়া হয়েছে।");
      if (action.rating < 1 || action.rating > 5) return DENY("রেটিং ১ থেকে ৫ হতে হবে।");
      return ALLOW;
    }

    case "ADD_ADDRESS":
      return ownsCustomer(action.address.customerId) || isAdmin(session)
        ? ALLOW
        : DENY();

    case "UPDATE_ADDRESS":
    case "DELETE_ADDRESS":
    case "SET_DEFAULT_ADDRESS": {
      const addressId =
        "addressId" in action ? action.addressId : "";
      const address = state.entities.addresses[addressId];
      if (!address) return DENY("ঠিকানাটি খুঁজে পাওয়া যায়নি।");
      return ownsCustomer(address.customerId) || isAdmin(session) ? ALLOW : DENY();
    }

    case "ADD_PAYOUT_METHOD":
      return customerId || providerId ? ALLOW : DENY();

    case "DELETE_PAYOUT_METHOD": {
      const method = state.entities.payoutMethods[action.id];
      if (!method) return DENY("পেমেন্ট মাধ্যমটি খুঁজে পাওয়া যায়নি।");
      const mine = method.ownerId === customerId || method.ownerId === providerId;
      return mine || isAdmin(session) ? ALLOW : DENY();
    }

    case "UPDATE_CUSTOMER_PROFILE":
      return customerId ? ALLOW : DENY("গ্রাহক হিসেবে লগ ইন করুন।");

    /* ---------------- provider ---------------- */

    case "START_JOB":
    case "COMPLETE_JOB": {
      const booking = state.entities.bookings[action.bookingId];
      if (!booking) return DENY("কাজটি খুঁজে পাওয়া যায়নি।");
      if (!ownsProvider(booking.providerId) && !isAdmin(session)) return DENY();

      const expected = action.type === "START_JOB" ? "upcoming" : "active";
      if (booking.status !== expected)
        return DENY("এই কাজের বর্তমান অবস্থায় এটি সম্ভব নয়।");
      return ALLOW;
    }

    case "TOGGLE_SERVICE_OFFERED":
    case "UPDATE_SERVICE_PRICE":
    case "SET_AVAILABILITY_SLOT":
    case "BULK_SET_AVAILABILITY":
    case "UPDATE_PROVIDER_PROFILE":
    case "SUBMIT_VERIFICATION_DOC":
    case "REQUEST_PAYOUT":
      return providerId ? ALLOW : DENY("পেশাদার হিসেবে লগ ইন করুন।");

    /* ---------------- messaging ---------------- */

    case "SEND_MESSAGE": {
      // Every conversation is with the Ghorly team. Customers and providers
      // write only in their own support thread, and never as anyone else;
      // there is no thread between a customer and a provider to write in.
      if (!action.body.trim()) return DENY("বার্তা খালি রাখা যাবে না।");
      const thread = state.entities.threads[action.threadId];

      if (action.role === "admin") {
        if (!isAdmin(session)) return DENY();
        if (thread) return ALLOW;
        // Opening a new conversation: it must name a real party who has none.
        const to = action.to;
        if (!to) return DENY("কাকে বার্তা পাঠাবেন তা বলুন।");
        const exists =
          to.kind === "customer"
            ? state.entities.customers[to.id]
            : state.entities.providers[to.id];
        if (!exists) return DENY("ব্যবহারকারীকে খুঁজে পাওয়া যায়নি।");
        return supportThreadFor(state.entities, to.kind, to.id)
          ? DENY("কথোপকথনটি আগেই আছে।")
          : ALLOW;
      }

      const own = action.role === "customer" ? customerId : providerId;
      if (!own) return DENY();
      if (thread) {
        return thread.kind === action.role && threadParty(thread) === own
          ? ALLOW
          : DENY();
      }
      // First message: opens the sender's own thread — once.
      return supportThreadFor(state.entities, action.role, own)
        ? DENY("কথোপকথনটি আগেই আছে।")
        : ALLOW;
    }

    /* ---------------- admin quotes ---------------- */

    case "SEND_QUOTATION": {
      if (!isAdmin(session)) return DENY("এটি শুধু প্রশাসকের জন্য।");
      const request = state.entities.requests[action.requestId];
      if (!request) return DENY("অনুরোধটি খুঁজে পাওয়া যায়নি।");
      if (request.status !== "open" && request.status !== "quoted")
        return DENY("এই অনুরোধটি আর খোলা নেই।");
      const provider = state.entities.providers[action.providerId];
      if (!provider || provider.status !== "active")
        return DENY("এই পেশাদারকে কাজ দেওয়া যাবে না।");
      if (!provider.activeCategoryIds.includes(request.categoryId))
        return DENY("এই পেশাদার এই সেবা দেন না।");
      if (action.providerPayout > action.amount)
        return DENY("পেশাদারের পাওনা গ্রাহকের দামের বেশি হতে পারে না।");
      return ALLOW;
    }

    case "WITHDRAW_QUOTE": {
      if (!isAdmin(session)) return DENY("এটি শুধু প্রশাসকের জন্য।");
      const quote = state.entities.quotes[action.quoteId];
      if (!quote) return DENY("কোটেশনটি খুঁজে পাওয়া যায়নি।");
      return quote.status === "sent" ? ALLOW : DENY("এই কোটেশন আর খোলা নেই।");
    }

    /* ---------------- admin only ---------------- */

    case "APPROVE_VERIFICATION":
    case "REJECT_VERIFICATION":
    case "SUSPEND_USER":
    case "REINSTATE_USER":
    case "HIDE_REVIEW":
    case "RESTORE_REVIEW":
    case "RESOLVE_DISPUTE":
    case "REFUND_PAYMENT":
    case "TOGGLE_CATEGORY_ACTIVE":
    case "TOGGLE_AREA_ACTIVE":
    case "SET_BOOKING_STATUS":
      return isAdmin(session) ? ALLOW : DENY("এটি শুধু প্রশাসকের জন্য।");

    default:
      // Exhaustiveness guard: a new action is denied until it is classified
      // here, which is the safe direction to fail in.
      return DENY("অজানা অ্যাকশন।");
  }
}
