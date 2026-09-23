import type { AppState, EntityKey } from "@/lib/store/types";
import type { Action } from "@/lib/store/actions";
import { EMPTY_DRAFT } from "@/lib/store/actions";
import { buildInitialState } from "@/lib/store/initial-state";
// Real clock, not the demo anchor: every case below runs in an event handler
// or in the /api/mutate route, never during render, so reading the system
// clock here is safe — and required, or a record a real person creates is
// stamped with the seed's frozen date.
import { currentDate, currentNaiveLocal } from "@/lib/data/clock";

const COMMISSION_RATE = 0.12;

/* -------------------------------------------------------------------------
   Small immutable helpers. Kept local so the 45 cases below stay readable.
   ------------------------------------------------------------------------- */

function patchEntity<K extends EntityKey>(
  state: AppState,
  key: K,
  id: string,
  patch: Partial<AppState["entities"][K][string]>,
): AppState {
  const current = state.entities[key][id];
  if (!current) return state;
  return {
    ...state,
    entities: {
      ...state.entities,
      [key]: {
        ...state.entities[key],
        [id]: { ...current, ...patch, updatedAt: currentNaiveLocal() },
      },
    },
  };
}

function addEntity<K extends EntityKey>(
  state: AppState,
  key: K,
  entity: AppState["entities"][K][string],
  /** Newest-first for feeds; appended for stable historical lists. */
  prepend = true,
): AppState {
  const id = (entity as { _id: string })._id;
  return {
    ...state,
    entities: {
      ...state.entities,
      [key]: { ...state.entities[key], [id]: entity },
    },
    order: {
      ...state.order,
      [key]: prepend ? [id, ...state.order[key]] : [...state.order[key], id],
    },
  };
}

function removeEntity(state: AppState, key: EntityKey, id: string): AppState {
  const next = { ...state.entities[key] };
  delete next[id];
  return {
    ...state,
    entities: { ...state.entities, [key]: next },
    order: { ...state.order, [key]: state.order[key].filter((x) => x !== id) },
  };
}

function bumpCounter(state: AppState, prefix: string): AppState {
  return {
    ...state,
    ui: {
      ...state.ui,
      counters: { ...state.ui.counters, [prefix]: (state.ui.counters[prefix] ?? 0) + 1 },
    },
  };
}

/* =========================================================================
   The reducer.

   Cross-entity cascades are the whole point — they are what makes a button
   feel like it did something real rather than flipping one flag. Accepting a
   request has to create a quote, attach it to the request, open a message
   thread and seed a system message, so that the request genuinely leaves one
   list and appears in another.
   ========================================================================= */

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    /* ---------------- system ---------------- */

    case "HYDRATE":
      return action.state;

    case "RESET_DEMO":
      return buildInitialState();

    case "SET_ROLE":
      return { ...state, session: { ...state.session, role: action.role } };

    case "LOGOUT":
      return { ...state, session: { ...state.session, role: "guest" } };

    /* ---------------- favourites ---------------- */

    case "TOGGLE_FAVORITE": {
      const on = state.ui.favorites.includes(action.providerId);
      return {
        ...state,
        ui: {
          ...state.ui,
          favorites: on
            ? state.ui.favorites.filter((id) => id !== action.providerId)
            : [action.providerId, ...state.ui.favorites],
        },
      };
    }

    /* ---------------- request wizard ---------------- */

    case "DRAFT_START":
      return {
        ...state,
        ui: { ...state.ui, requestDraft: { ...EMPTY_DRAFT, ...action.patch } },
      };

    case "DRAFT_PATCH":
      return {
        ...state,
        ui: {
          ...state.ui,
          requestDraft: { ...(state.ui.requestDraft ?? EMPTY_DRAFT), ...action.patch },
        },
      };

    case "DRAFT_SET_STEP":
      return {
        ...state,
        ui: {
          ...state.ui,
          requestDraft: { ...(state.ui.requestDraft ?? EMPTY_DRAFT), step: action.step },
        },
      };

    case "DRAFT_RESET":
      return { ...state, ui: { ...state.ui, requestDraft: null } };

    case "SUBMIT_REQUEST": {
      // The action carries the draft; `state.ui.requestDraft` is only a
      // fallback for an optimistic client dispatch. The server has no draft of
      // its own — draft edits are local UI state and never leave the browser.
      const draft = action.draft ?? state.ui.requestDraft;
      if (!draft || !draft.categoryId) return state;

      let next = addEntity(state, "requests", {
        _id: action.requestId,
        customerId: state.session.customerId,
        categoryId: draft.categoryId,
        bnTitle: draft.bnTitle,
        bnDescription: draft.bnDescription,
        areaId: draft.areaId ?? "",
        addressId: draft.addressId,
        preferredDate: draft.preferredDate ?? currentDate(),
        preferredSlot: draft.preferredSlot ?? "morning-1",
        urgency: draft.urgency,
        budgetFrom: draft.budgetFrom,
        budgetTo: draft.budgetTo,
        status: "open",
        quoteIds: [],
        bookingId: null,
        createdAt: currentNaiveLocal(),
        updatedAt: currentNaiveLocal(),
      });
      next = bumpCounter(next, "req");
      return { ...next, ui: { ...next.ui, requestDraft: null } };
    }

    case "CANCEL_REQUEST":
      return patchEntity(state, "requests", action.requestId, { status: "cancelled" });

    /* ---------------- provider responds ---------------- */

    case "ACCEPT_REQUEST": {
      const request = state.entities.requests[action.requestId];
      if (!request) return state;
      const providerId = state.session.providerId;

      // 1. the quote
      let next = addEntity(state, "quotes", {
        _id: action.quoteId,
        requestId: action.requestId,
        providerId,
        customerId: request.customerId,
        amount: action.amount,
        bnMessage: action.message,
        estimatedMinutes: action.estimatedMinutes,
        status: "sent",
        validUntil: request.preferredDate,
        createdAt: currentNaiveLocal(),
        updatedAt: currentNaiveLocal(),
      });

      // 2. attach it to the request and move the request out of "open"
      next = patchEntity(next, "requests", action.requestId, {
        status: "quoted",
        quoteIds: [...request.quoteIds, action.quoteId],
      });

      // 3. open a conversation if the pair don't already have one
      const existing = Object.values(next.entities.threads).find(
        (t) => t.customerId === request.customerId && t.providerId === providerId,
      );

      if (existing) {
        next = addEntity(
          next,
          "messages",
          {
            _id: action.messageId,
            threadId: existing._id,
            senderRole: "system",
            senderId: "system",
            bnBody: "নতুন কোটেশন পাঠানো হয়েছে।",
            sentAt: currentNaiveLocal(),
            isRead: false,
            createdAt: currentNaiveLocal(),
            updatedAt: currentNaiveLocal(),
          },
          false,
        );
        next = patchEntity(next, "threads", existing._id, {
          lastMessageAt: currentNaiveLocal(),
          messageIds: [...existing.messageIds, action.messageId],
        });
      } else {
        next = addEntity(
          next,
          "messages",
          {
            _id: action.messageId,
            threadId: action.threadId,
            senderRole: "system",
            senderId: "system",
            bnBody: "কোটেশন পাঠানো হয়েছে।",
            sentAt: currentNaiveLocal(),
            isRead: false,
            createdAt: currentNaiveLocal(),
            updatedAt: currentNaiveLocal(),
          },
          false,
        );
        next = addEntity(next, "threads", {
          _id: action.threadId,
          customerId: request.customerId,
          providerId,
          bookingId: null,
          requestId: action.requestId,
          bnSubject: request.bnTitle,
          lastMessageAt: currentNaiveLocal(),
          messageIds: [action.messageId],
          createdAt: currentNaiveLocal(),
          updatedAt: currentNaiveLocal(),
        });
      }

      next = bumpCounter(next, "quo");
      next = bumpCounter(next, "msg");
      return next;
    }

    case "DECLINE_REQUEST":
      // Declining is per-provider in a real system; in the prototype the
      // request simply leaves this provider's queue.
      return patchEntity(state, "requests", action.requestId, { status: "expired" });

    case "WITHDRAW_QUOTE":
      return patchEntity(state, "quotes", action.quoteId, { status: "withdrawn" });

    /* ---------------- customer decides ---------------- */

    case "ACCEPT_QUOTE": {
      const quote = state.entities.quotes[action.quoteId];
      if (!quote) return state;
      const request = state.entities.requests[quote.requestId];
      if (!request) return state;

      let next = patchEntity(state, "quotes", action.quoteId, { status: "accepted" });

      // Every sibling quote on the same request is now declined.
      for (const siblingId of request.quoteIds) {
        if (siblingId !== action.quoteId) {
          next = patchEntity(next, "quotes", siblingId, { status: "declined" });
        }
      }

      const commission = Math.round(quote.amount * COMMISSION_RATE);

      next = addEntity(next, "bookings", {
        _id: action.bookingId,
        requestId: request._id,
        quoteId: quote._id,
        customerId: quote.customerId,
        providerId: quote.providerId,
        categoryId: request.categoryId,
        bnTitle: request.bnTitle,
        addressId: request.addressId ?? "",
        areaId: request.areaId,
        scheduledDate: request.preferredDate,
        scheduledSlot: request.preferredSlot,
        durationMinutes: quote.estimatedMinutes,
        amount: quote.amount,
        commission,
        status: "upcoming",
        paymentId: action.paymentId,
        reviewId: null,
        bnCancelReason: null,
        createdAt: currentNaiveLocal(),
        updatedAt: currentNaiveLocal(),
      });

      next = addEntity(next, "payments", {
        _id: action.paymentId,
        bookingId: action.bookingId,
        customerId: quote.customerId,
        providerId: quote.providerId,
        amount: quote.amount,
        commission,
        method: "bkash",
        status: "pending",
        reference: "—",
        paidAt: null,
        createdAt: currentNaiveLocal(),
        updatedAt: currentNaiveLocal(),
      });

      next = patchEntity(next, "requests", request._id, {
        status: "booked",
        bookingId: action.bookingId,
      });

      next = bumpCounter(next, "bkg");
      next = bumpCounter(next, "pay");
      return next;
    }

    case "DECLINE_QUOTE":
      return patchEntity(state, "quotes", action.quoteId, { status: "declined" });

    case "CONFIRM_BOOKING": {
      const booking = state.entities.bookings[action.bookingId];
      if (!booking?.paymentId) return state;
      return patchEntity(state, "payments", booking.paymentId, {
        method: action.method,
      });
    }

    case "CANCEL_BOOKING": {
      const booking = state.entities.bookings[action.bookingId];
      if (!booking) return state;
      let next = patchEntity(state, "bookings", action.bookingId, {
        status: "cancelled",
        bnCancelReason: action.reason,
      });
      if (booking.paymentId) {
        next = patchEntity(next, "payments", booking.paymentId, { status: "refunded" });
      }
      if (booking.requestId) {
        next = patchEntity(next, "requests", booking.requestId, { status: "cancelled" });
      }
      return next;
    }

    case "RESCHEDULE_BOOKING":
      return patchEntity(state, "bookings", action.bookingId, {
        scheduledDate: action.date,
        scheduledSlot: action.slot,
      });

    /* ---------------- the job runs ---------------- */

    case "START_JOB":
      return patchEntity(state, "bookings", action.bookingId, { status: "active" });

    case "COMPLETE_JOB": {
      const booking = state.entities.bookings[action.bookingId];
      if (!booking) return state;

      let next = patchEntity(state, "bookings", action.bookingId, { status: "completed" });

      if (booking.paymentId) {
        next = patchEntity(next, "payments", booking.paymentId, {
          status: "paid",
          paidAt: currentNaiveLocal(),
        });
      }

      // The provider's public job count goes up, which is visible immediately
      // on their profile card anywhere in the app.
      const provider = next.entities.providers[booking.providerId];
      if (provider) {
        next = patchEntity(next, "providers", booking.providerId, {
          completedJobs: provider.completedJobs + 1,
        });
      }
      return next;
    }

    case "SET_BOOKING_STATUS":
      return patchEntity(state, "bookings", action.bookingId, { status: action.status });

    case "SUBMIT_REVIEW": {
      const booking = state.entities.bookings[action.bookingId];
      if (!booking) return state;

      let next = addEntity(state, "reviews", {
        _id: action.reviewId,
        bookingId: action.bookingId,
        providerId: booking.providerId,
        customerId: booking.customerId,
        categoryId: booking.categoryId,
        rating: action.rating,
        bnBody: action.body,
        isHidden: false,
        bnProviderReply: null,
        createdAt: currentNaiveLocal(),
        updatedAt: currentNaiveLocal(),
      });

      next = patchEntity(next, "bookings", action.bookingId, { reviewId: action.reviewId });

      // Fold the new score into the provider's running average.
      const provider = next.entities.providers[booking.providerId];
      if (provider) {
        const total = provider.rating * provider.reviewCount + action.rating;
        const count = provider.reviewCount + 1;
        next = patchEntity(next, "providers", booking.providerId, {
          reviewCount: count,
          rating: Math.round((total / count) * 10) / 10,
        });
      }

      next = bumpCounter(next, "rev");
      return next;
    }

    /* ---------------- addresses & payouts ---------------- */

    case "ADD_ADDRESS": {
      let next = addEntity(state, "addresses", action.address, false);
      if (action.address.isDefault) {
        for (const id of next.order.addresses) {
          const a = next.entities.addresses[id];
          if (a.customerId === action.address.customerId && id !== action.address._id) {
            next = patchEntity(next, "addresses", id, { isDefault: false });
          }
        }
      }
      return bumpCounter(next, "adr");
    }

    case "UPDATE_ADDRESS":
      return patchEntity(state, "addresses", action.addressId, action.patch);

    case "DELETE_ADDRESS":
      return removeEntity(state, "addresses", action.addressId);

    case "SET_DEFAULT_ADDRESS": {
      const target = state.entities.addresses[action.addressId];
      if (!target) return state;
      let next = state;
      for (const id of state.order.addresses) {
        const a = state.entities.addresses[id];
        if (a.customerId !== target.customerId) continue;
        next = patchEntity(next, "addresses", id, { isDefault: id === action.addressId });
      }
      return next;
    }

    case "ADD_PAYOUT_METHOD": {
      const next = addEntity(
        state,
        "payoutMethods",
        {
          _id: action.id,
          ownerId: state.session.customerId,
          kind: action.kind,
          bnLabel: action.label,
          reference: action.reference,
          isDefault: false,
          createdAt: currentNaiveLocal(),
          updatedAt: currentNaiveLocal(),
        },
        false,
      );
      return bumpCounter(next, "pom");
    }

    case "DELETE_PAYOUT_METHOD":
      return removeEntity(state, "payoutMethods", action.id);

    case "UPDATE_CUSTOMER_PROFILE":
      return patchEntity(state, "customers", state.session.customerId, action.patch);

    /* ---------------- provider settings ---------------- */

    case "UPDATE_PROVIDER_PROFILE":
      return patchEntity(state, "providers", state.session.providerId, action.patch);

    case "TOGGLE_SERVICE_OFFERED": {
      const provider = state.entities.providers[state.session.providerId];
      if (!provider) return state;
      const on = provider.activeCategoryIds.includes(action.categoryId);
      return patchEntity(state, "providers", provider._id, {
        activeCategoryIds: on
          ? provider.activeCategoryIds.filter((id) => id !== action.categoryId)
          : [...provider.activeCategoryIds, action.categoryId],
      });
    }

    case "UPDATE_SERVICE_PRICE": {
      const provider = state.entities.providers[state.session.providerId];
      if (!provider) return state;
      return patchEntity(state, "providers", provider._id, {
        categoryPricing: {
          ...provider.categoryPricing,
          [action.categoryId]: action.price,
        },
      });
    }

    case "SET_AVAILABILITY_SLOT": {
      const provider = state.entities.providers[state.session.providerId];
      if (!provider) return state;
      const day = provider.availability[action.weekday] ?? [];
      const on = day.includes(action.slot);
      return patchEntity(state, "providers", provider._id, {
        availability: {
          ...provider.availability,
          [action.weekday]: on
            ? day.filter((s) => s !== action.slot)
            : [...day, action.slot],
        },
      });
    }

    case "BULK_SET_AVAILABILITY": {
      const provider = state.entities.providers[state.session.providerId];
      if (!provider) return state;
      return patchEntity(state, "providers", provider._id, {
        availability: { ...provider.availability, [action.weekday]: action.slots },
      });
    }

    case "SUBMIT_VERIFICATION_DOC": {
      const verification = Object.values(state.entities.verifications).find(
        (v) => v.providerId === state.session.providerId,
      );
      if (!verification) return state;
      return patchEntity(state, "verifications", verification._id, {
        docs: verification.docs.map((d) =>
          d.kind === action.kind ? { ...d, isSubmitted: true } : d,
        ),
        status: "pending",
      });
    }

    case "REQUEST_PAYOUT":
      // No payout ledger in the prototype — the toast plus the earnings figure
      // recomputing from paid bookings is the whole behaviour.
      return state;

    /* ---------------- messaging ---------------- */

    case "SEND_MESSAGE": {
      const thread = state.entities.threads[action.threadId];
      if (!thread) return state;

      let next = addEntity(
        state,
        "messages",
        {
          _id: action.messageId,
          threadId: action.threadId,
          senderRole: action.role,
          senderId:
            action.role === "customer" ? thread.customerId : thread.providerId,
          bnBody: action.body,
          sentAt: action.sentAt,
          isRead: true,
          createdAt: action.sentAt,
          updatedAt: action.sentAt,
        },
        false,
      );

      next = patchEntity(next, "threads", action.threadId, {
        lastMessageAt: action.sentAt,
        messageIds: [...thread.messageIds, action.messageId],
      });

      return bumpCounter(next, "msg");
    }

    case "MARK_THREAD_READ": {
      const unread = { ...state.ui.unreadByThread };
      delete unread[action.threadId];
      return { ...state, ui: { ...state.ui, unreadByThread: unread } };
    }

    /* ---------------- admin ---------------- */

    case "APPROVE_VERIFICATION": {
      const verification = state.entities.verifications[action.verificationId];
      if (!verification) return state;

      let next = patchEntity(state, "verifications", action.verificationId, {
        status: "approved",
        reviewedAt: action.at,
        bnNote: "সব কাগজপত্র যাচাই সম্পন্ন।",
      });
      // The provider now renders the verified badge on every public card.
      next = patchEntity(next, "providers", verification.providerId, {
        isVerified: true,
      });
      return next;
    }

    case "REJECT_VERIFICATION": {
      const verification = state.entities.verifications[action.verificationId];
      if (!verification) return state;
      let next = patchEntity(state, "verifications", action.verificationId, {
        status: "rejected",
        reviewedAt: action.at,
        bnNote: action.note,
      });
      next = patchEntity(next, "providers", verification.providerId, {
        isVerified: false,
      });
      return next;
    }

    case "SUSPEND_USER":
      return patchEntity(
        state,
        action.kind === "customer" ? "customers" : "providers",
        action.id,
        { status: "suspended" },
      );

    case "REINSTATE_USER":
      return patchEntity(
        state,
        action.kind === "customer" ? "customers" : "providers",
        action.id,
        { status: "active" },
      );

    case "HIDE_REVIEW":
      return patchEntity(state, "reviews", action.reviewId, { isHidden: true });

    case "RESTORE_REVIEW":
      return patchEntity(state, "reviews", action.reviewId, { isHidden: false });

    case "RESOLVE_DISPUTE":
      return patchEntity(state, "disputes", action.disputeId, {
        status: "resolved",
        bnResolution: action.resolution,
        resolvedAt: action.at,
      });

    case "REFUND_PAYMENT": {
      const payment = state.entities.payments[action.paymentId];
      if (!payment) return state;
      let next = patchEntity(state, "payments", action.paymentId, { status: "refunded" });
      next = patchEntity(next, "bookings", payment.bookingId, { status: "cancelled" });
      return next;
    }

    case "TOGGLE_CATEGORY_ACTIVE": {
      const category = state.entities.categories[action.categoryId];
      if (!category) return state;
      return patchEntity(state, "categories", action.categoryId, {
        isActive: !category.isActive,
      });
    }

    case "TOGGLE_AREA_ACTIVE": {
      const area = state.entities.areas[action.areaId];
      if (!area) return state;
      return patchEntity(state, "areas", action.areaId, { isActive: !area.isActive });
    }

    default:
      return state;
  }
}
