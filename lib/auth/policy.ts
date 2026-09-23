import type { Action } from "@/lib/store/actions";
import type { AppState } from "@/lib/store/types";
import type { Session } from "@/lib/auth/types";

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

export function authorize(
  session: Session | null,
  action: Action,
  state: AppState,
): Decision {
  if (!session) return DENY("লগ ইন করুন।");

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

    // Wiping the dataset is a demo affordance, never a production one.
    case "RESET_DEMO":
      return process.env.NODE_ENV !== "production"
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
      return ownsCustomer(quote.customerId) || isAdmin(session) ? ALLOW : DENY();
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

    case "ACCEPT_REQUEST":
    case "DECLINE_REQUEST": {
      if (!providerId) return DENY("পেশাদার হিসেবে লগ ইন করুন।");
      const request = state.entities.requests[action.requestId];
      if (!request) return DENY("অনুরোধটি খুঁজে পাওয়া যায়নি।");
      if (request.status !== "open" && request.status !== "quoted")
        return DENY("এই অনুরোধটি আর খোলা নেই।");

      // A provider may only quote on work they actually offer, in an area they
      // actually serve — otherwise the open-request feed is just a list of
      // every job on the platform.
      const provider = state.entities.providers[providerId];
      if (!provider) return DENY();
      const offersService = provider.activeCategoryIds.includes(request.categoryId);
      const servesArea =
        provider.areaId === request.areaId ||
        provider.serviceAreaIds.includes(request.areaId);
      if (!offersService || !servesArea)
        return DENY("এই অনুরোধটি আপনার সেবা বা এলাকার সাথে মেলে না।");

      if (action.type === "ACCEPT_REQUEST" && action.amount <= 0)
        return DENY("সঠিক দর লিখুন।");
      return ALLOW;
    }

    case "WITHDRAW_QUOTE": {
      const quote = state.entities.quotes[action.quoteId];
      if (!quote) return DENY("কোটেশনটি খুঁজে পাওয়া যায়নি।");
      if (quote.status === "accepted")
        return DENY("গৃহীত কোটেশন প্রত্যাহার করা যায় না।");
      return ownsProvider(quote.providerId) || isAdmin(session) ? ALLOW : DENY();
    }

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
      const thread = state.entities.threads[action.threadId];
      if (!thread) return DENY("কথোপকথনটি খুঁজে পাওয়া যায়নি।");
      const participant =
        ownsCustomer(thread.customerId) || ownsProvider(thread.providerId);
      if (!participant && !isAdmin(session)) return DENY();
      // You cannot post as the other party.
      if (action.role === "customer" && !ownsCustomer(thread.customerId) && !isAdmin(session))
        return DENY();
      if (action.role === "provider" && !ownsProvider(thread.providerId) && !isAdmin(session))
        return DENY();
      if (!action.body.trim()) return DENY("বার্তা খালি রাখা যাবে না।");
      return ALLOW;
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
