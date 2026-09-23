import type { AppState } from "@/lib/store/types";
import type {
  Address,
  BookingStatus,
  Message,
  MessageThread,
  PaymentMethodKind,
  RequestDraft,
  Role,
  UrgencyLevel,
} from "@/lib/types";

/**
 * Every mutation the prototype supports, in one union.
 *
 * This list plus `reducer.ts` is the complete answer to "what can actually
 * happen in this product" — which is why it lives in one reviewable place
 * rather than being scattered across fifty view components.
 */
export type Action =
  /* session */
  | { type: "SET_ROLE"; role: Role }
  | { type: "LOGOUT" }
  /* system */
  | { type: "HYDRATE"; state: AppState }
  | { type: "RESET_DEMO" }
  /* favourites */
  | { type: "TOGGLE_FAVORITE"; providerId: string }
  /* request wizard */
  | { type: "DRAFT_START"; patch?: Partial<RequestDraft> }
  | { type: "DRAFT_PATCH"; patch: Partial<RequestDraft> }
  | { type: "DRAFT_SET_STEP"; step: number }
  | { type: "DRAFT_RESET" }
  // The draft travels WITH the action. It used to be read from
  // `state.ui.requestDraft`, which broke the moment draft edits stopped
  // being sent to the server: the server had no draft, so it created
  // nothing while the client optimistically showed success.
  | { type: "SUBMIT_REQUEST"; requestId: string; draft: RequestDraft }
  /* customer */
  | { type: "CANCEL_REQUEST"; requestId: string }
  // `threadId`/`messageId` post "new job assigned" into the provider's support
  // thread (the thread is created if the provider has none yet).
  | { type: "ACCEPT_QUOTE"; quoteId: string; bookingId: string; paymentId: string; threadId: string; messageId: string }
  | { type: "DECLINE_QUOTE"; quoteId: string }
  | { type: "CONFIRM_BOOKING"; bookingId: string; method: PaymentMethodKind }
  | { type: "CANCEL_BOOKING"; bookingId: string; reason: string }
  | { type: "RESCHEDULE_BOOKING"; bookingId: string; date: string; slot: string }
  | { type: "SUBMIT_REVIEW"; bookingId: string; reviewId: string; rating: number; body: string }
  | { type: "ADD_ADDRESS"; address: Address }
  | { type: "UPDATE_ADDRESS"; addressId: string; patch: Partial<Address> }
  | { type: "DELETE_ADDRESS"; addressId: string }
  | { type: "SET_DEFAULT_ADDRESS"; addressId: string }
  | { type: "ADD_PAYOUT_METHOD"; id: string; kind: PaymentMethodKind; label: string; reference: string }
  | { type: "DELETE_PAYOUT_METHOD"; id: string }
  | { type: "UPDATE_CUSTOMER_PROFILE"; patch: { bnName?: string; email?: string } }
  /* provider */
  | { type: "START_JOB"; bookingId: string }
  | { type: "COMPLETE_JOB"; bookingId: string }
  | { type: "TOGGLE_SERVICE_OFFERED"; categoryId: string }
  | { type: "UPDATE_SERVICE_PRICE"; categoryId: string; price: number }
  | { type: "SET_AVAILABILITY_SLOT"; weekday: number; slot: string }
  | { type: "BULK_SET_AVAILABILITY"; weekday: number; slots: string[] }
  | { type: "UPDATE_PROVIDER_PROFILE"; patch: { bnTitle?: string; bnBio?: string; priceFrom?: number } }
  | { type: "SUBMIT_VERIFICATION_DOC"; kind: string }
  | { type: "REQUEST_PAYOUT" }
  /* messaging */
  // Every thread is between the Ghorly team and one party. Sending into a
  // thread id that doesn't exist yet opens it: for a customer or provider it
  // is their own support thread; the admin names who it is `to`.
  | {
      type: "SEND_MESSAGE";
      threadId: string;
      messageId: string;
      body: string;
      role: "customer" | "provider" | "admin";
      sentAt: string;
      to?: { kind: "customer" | "provider"; id: string };
    }
  | { type: "MARK_THREAD_READ"; threadId: string }
  // Pushed by /api/messages/stream — browser-only, never sent to the server.
  | { type: "RECEIVE_MESSAGE"; message: Message; thread: MessageThread; unread: boolean }
  // Read receipts — browser-only; the server records them via /api/messages/read.
  | { type: "MESSAGES_READ"; messageIds: string[]; readAt: string }
  /* admin */
  // The admin agreed a price with a provider offline and now offers it to the
  // customer. Replaces any quotation still open on the request.
  | {
      type: "SEND_QUOTATION";
      requestId: string;
      quoteId: string;
      providerId: string;
      amount: number;
      providerPayout: number;
      estimatedMinutes: number;
      message: string;
      threadId: string;
      messageId: string;
    }
  | { type: "WITHDRAW_QUOTE"; quoteId: string }
  | { type: "APPROVE_VERIFICATION"; verificationId: string; at: string }
  | { type: "REJECT_VERIFICATION"; verificationId: string; note: string; at: string }
  | { type: "SUSPEND_USER"; id: string; kind: "customer" | "provider" }
  | { type: "REINSTATE_USER"; id: string; kind: "customer" | "provider" }
  | { type: "HIDE_REVIEW"; reviewId: string }
  | { type: "RESTORE_REVIEW"; reviewId: string }
  | { type: "RESOLVE_DISPUTE"; disputeId: string; resolution: string; at: string }
  | { type: "REFUND_PAYMENT"; paymentId: string }
  | { type: "TOGGLE_CATEGORY_ACTIVE"; categoryId: string }
  | { type: "TOGGLE_AREA_ACTIVE"; areaId: string }
  /* booking status, used by admin tables */
  | { type: "SET_BOOKING_STATUS"; bookingId: string; status: BookingStatus };

export type Dispatch = (action: Action) => void;

export const EMPTY_DRAFT: RequestDraft = {
  step: 0,
  categoryId: null,
  bnTitle: "",
  bnDescription: "",
  areaId: null,
  addressId: null,
  bnAddressLine: "",
  preferredDate: null,
  preferredSlot: null,
  urgency: "flexible" as UrgencyLevel,
  budgetFrom: null,
  budgetTo: null,
};
