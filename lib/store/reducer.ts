import type { AppState, EntityKey } from "@/lib/store/types";
import type { Action } from "@/lib/store/actions";
import { EMPTY_DRAFT } from "@/lib/store/actions";
import { buildInitialState } from "@/lib/store/initial-state";
// Real clock, not the demo anchor: every case below runs in an event handler
// or in the /api/mutate route, never during render, so reading the system
// clock here is safe — and required, or a record a real person creates is
// stamped with the seed's frozen date.
import { currentDate, currentNaiveLocal } from "@/lib/data/clock";
import { supportThreadFor, threadParty, type SupportKind } from "@/lib/store/support";
import type { Message } from "@/lib/types";

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

/**
 * Posts one message into a party's support thread, opening the thread with
 * `threadId` if they don't have one yet. Every conversation in the product is
 * between the Ghorly team and one customer or one provider.
 */
function postToSupport(
  state: AppState,
  opts: {
    kind: SupportKind;
    partyId: string;
    threadId: string;
    messageId: string;
    senderRole: Message["senderRole"];
    senderId: string;
    body: string;
    at: string;
    requestId?: string | null;
    bookingId?: string | null;
  },
): AppState {
  const existing = supportThreadFor(state.entities, opts.kind, opts.partyId);
  const threadId = existing?._id ?? opts.threadId;

  let next = addEntity(
    state,
    "messages",
    {
      _id: opts.messageId,
      threadId,
      senderRole: opts.senderRole,
      senderId: opts.senderId,
      bnBody: opts.body,
      sentAt: opts.at,
      // Unread until the *other* end of the thread opens it — that is what
      // the sender's read receipt shows.
      isRead: false,
      readAt: null,
      createdAt: opts.at,
      updatedAt: opts.at,
    },
    false,
  );

  if (existing) {
    next = patchEntity(next, "threads", existing._id, {
      lastMessageAt: opts.at,
      // Never list a message twice, whatever order events arrive in.
      messageIds: existing.messageIds.includes(opts.messageId)
        ? existing.messageIds
        : [...existing.messageIds, opts.messageId],
      requestId: opts.requestId ?? existing.requestId,
      bookingId: opts.bookingId ?? existing.bookingId,
    });
  } else {
    next = addEntity(next, "threads", {
      _id: threadId,
      kind: opts.kind,
      customerId: opts.kind === "customer" ? opts.partyId : null,
      providerId: opts.kind === "provider" ? opts.partyId : null,
      bookingId: opts.bookingId ?? null,
      requestId: opts.requestId ?? null,
      bnSubject: "ঘরলি সাপোর্ট",
      lastMessageAt: opts.at,
      messageIds: [opts.messageId],
      createdAt: opts.at,
      updatedAt: opts.at,
    });
    next = bumpCounter(next, "thr");
  }

  return bumpCounter(next, "msg");
}

/** Puts a request back in the admin queue once no quotation on it is live. */
function reopenIfNoLiveQuote(state: AppState, requestId: string): AppState {
  const request = state.entities.requests[requestId];
  if (!request || request.status !== "quoted") return state;
  const live = request.quoteIds.some((id) => state.entities.quotes[id]?.status === "sent");
  return live ? state : patchEntity(state, "requests", requestId, { status: "open" });
}

/* =========================================================================
   The reducer.

   Cross-entity cascades are the whole point — they are what makes a button
   feel like it did something real rather than flipping one flag. Sending a
   quotation has to create the quote, retire the previous one, move the
   request out of the admin queue and tell the customer in their support
   thread, so the request genuinely leaves one list and appears in another.
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

    /* ---------------- admin quotes ---------------- */

    case "SEND_QUOTATION": {
      const request = state.entities.requests[action.requestId];
      if (!request) return state;
      const now = currentNaiveLocal();

      // One live quotation per request: a new offer replaces the old one.
      let next = state;
      for (const id of request.quoteIds) {
        if (next.entities.quotes[id]?.status === "sent") {
          next = patchEntity(next, "quotes", id, { status: "withdrawn" });
        }
      }

      next = addEntity(next, "quotes", {
        _id: action.quoteId,
        requestId: request._id,
        providerId: action.providerId,
        customerId: request.customerId,
        amount: action.amount,
        providerPayout: action.providerPayout,
        bnMessage: action.message,
        estimatedMinutes: action.estimatedMinutes,
        status: "sent",
        validUntil: request.preferredDate,
        createdAt: now,
        updatedAt: now,
      });

      next = patchEntity(next, "requests", request._id, {
        status: "quoted",
        quoteIds: [...request.quoteIds, action.quoteId],
      });

      next = postToSupport(next, {
        kind: "customer",
        partyId: request.customerId,
        threadId: action.threadId,
        messageId: action.messageId,
        senderRole: "system",
        senderId: "system",
        body: `“${request.bnTitle}” — এর জন্য কোটেশন পাঠানো হয়েছে। অনুরোধের পাতায় দেখে নিশ্চিত করুন।`,
        at: now,
        requestId: request._id,
      });

      return bumpCounter(next, "quo");
    }

    case "WITHDRAW_QUOTE": {
      const quote = state.entities.quotes[action.quoteId];
      if (!quote) return state;
      const next = patchEntity(state, "quotes", action.quoteId, { status: "withdrawn" });
      return reopenIfNoLiveQuote(next, quote.requestId);
    }

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

      // The admin agreed the provider's payout; the platform keeps the rest.
      // Older quotes without a payout fall back to the standard rate.
      const commission =
        typeof quote.providerPayout === "number"
          ? quote.amount - quote.providerPayout
          : Math.round(quote.amount * COMMISSION_RATE);

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

      // Assignment is final: the provider hears about the job from the team.
      next = postToSupport(next, {
        kind: "provider",
        partyId: quote.providerId,
        threadId: action.threadId,
        messageId: action.messageId,
        senderRole: "system",
        senderId: "system",
        body: `নতুন কাজ দেওয়া হয়েছে: “${request.bnTitle}”। কাজের তালিকায় বিস্তারিত দেখুন।`,
        at: currentNaiveLocal(),
        bookingId: action.bookingId,
      });

      next = bumpCounter(next, "bkg");
      next = bumpCounter(next, "pay");
      return next;
    }

    case "DECLINE_QUOTE": {
      const quote = state.entities.quotes[action.quoteId];
      if (!quote) return state;
      const next = patchEntity(state, "quotes", action.quoteId, { status: "declined" });
      // Back to the admin's queue so the team can find another professional.
      return reopenIfNoLiveQuote(next, quote.requestId);
    }

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
          // A provider's payout account belongs to the provider record; using
          // `customerId` left it owned by "" for provider-only accounts, where
          // nobody could ever delete it.
          ownerId:
            state.session.role === "provider"
              ? state.session.providerId
              : state.session.customerId,
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

      // Whose thread this is: an existing one names its party; a new one is
      // the sender's own, or — for the admin — whoever it is addressed `to`.
      const kind: SupportKind | undefined =
        thread?.kind ?? (action.role === "admin" ? action.to?.kind : action.role);
      const partyId =
        (thread && threadParty(thread)) ??
        (action.role === "admin"
          ? action.to?.id
          : action.role === "customer"
            ? state.session.customerId
            : state.session.providerId);
      if (!kind || !partyId) return state;

      return postToSupport(state, {
        kind,
        partyId,
        threadId: action.threadId,
        messageId: action.messageId,
        senderRole: action.role,
        senderId: action.role === "admin" ? "admin" : partyId,
        body: action.body,
        at: action.sentAt,
      });
    }

    case "RECEIVE_MESSAGE": {
      const { message } = action;
      // Our own send already put it here (optimistically or via the server's
      // reply); the stream just echoes it back.
      if (state.entities.messages[message._id]) return state;

      let next = addEntity(state, "messages", message, false);
      const known = next.entities.threads[action.thread._id];
      const base = known ?? action.thread;
      const thread = {
        ...base,
        lastMessageAt: message.sentAt > base.lastMessageAt ? message.sentAt : base.lastMessageAt,
        messageIds: base.messageIds.includes(message._id)
          ? base.messageIds
          : [...base.messageIds, message._id],
      };
      next = known
        ? { ...next, entities: { ...next.entities, threads: { ...next.entities.threads, [thread._id]: thread } } }
        : addEntity(next, "threads", thread);

      if (!action.unread) return next;
      return {
        ...next,
        ui: {
          ...next.ui,
          unreadByThread: {
            ...next.ui.unreadByThread,
            [thread._id]: (next.ui.unreadByThread[thread._id] ?? 0) + 1,
          },
        },
      };
    }

    case "MESSAGES_READ": {
      // Pushed by the stream (or applied optimistically by the reader).
      const messages = { ...state.entities.messages };
      let changed = false;
      for (const id of action.messageIds) {
        const m = messages[id];
        if (m && !m.isRead) {
          messages[id] = { ...m, isRead: true, readAt: action.readAt };
          changed = true;
        }
      }
      return changed ? { ...state, entities: { ...state.entities, messages } } : state;
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
