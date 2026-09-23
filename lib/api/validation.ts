import { z } from "zod";

/**
 * Runtime validation for incoming actions.
 *
 * The `Action` union in `lib/store/actions.ts` is a *compile-time* guarantee
 * about our own code. It says nothing about what arrives over the wire — at
 * runtime a request body is just JSON, and `as Action` is a lie the type
 * checker happily believes. These schemas are the actual gate.
 */

const id = z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/, "invalid id");
const bnText = (max: number) => z.string().trim().min(1).max(max);
const money = z.number().int().nonnegative().max(10_000_000);
const minutes = z.number().int().positive().max(60 * 24);
/** Naive-local timestamps, the format the whole app uses. */
const timestamp = z.string().regex(/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2})?$/);

const urgency = z.enum(["flexible", "soon", "urgent"]);
const role = z.enum(["customer", "provider", "admin"]);
const paymentMethod = z.enum(["bkash", "nagad", "rocket", "card", "cash", "bank"]);
const bookingStatus = z.enum(["upcoming", "active", "completed", "cancelled"]);

const draftShape = z.object({
    step: z.number().int().min(0).max(5),
    categoryId: id.nullable(),
    bnTitle: z.string().max(200),
    bnDescription: z.string().max(4000),
    areaId: id.nullable(),
    addressId: id.nullable(),
    bnAddressLine: z.string().max(300),
    preferredDate: timestamp.nullable(),
    preferredSlot: z.string().max(40).nullable(),
    urgency,
    budgetFrom: money.nullable(),
    budgetTo: money.nullable(),
});

/** Patches carry only the changed keys. */
const draftPatch = draftShape.partial();

/**
 * Submission carries the whole draft.
 *
 * It has to: draft edits are local UI state and never reach the server, so the
 * server has no draft to read when `SUBMIT_REQUEST` arrives. Note that zod
 * strips unknown keys — if this field were missing from the schema the draft
 * would be silently discarded and the request would never be created, while
 * the endpoint still answered 200.
 */
const draftFull = draftShape;

const address = z.object({
  _id: id,
  customerId: id,
  bnLabel: bnText(60),
  bnLine1: bnText(200),
  bnLine2: z.string().max(200),
  areaId: id,
  isDefault: z.boolean(),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const ActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("SET_ROLE"), role }),
  z.object({ type: z.literal("LOGOUT") }),
  z.object({ type: z.literal("RESET_DEMO") }),

  z.object({ type: z.literal("TOGGLE_FAVORITE"), providerId: id }),

  z.object({ type: z.literal("DRAFT_START"), patch: draftPatch.optional() }),
  z.object({ type: z.literal("DRAFT_PATCH"), patch: draftPatch }),
  z.object({ type: z.literal("DRAFT_SET_STEP"), step: z.number().int().min(0).max(5) }),
  z.object({ type: z.literal("DRAFT_RESET") }),
  z.object({ type: z.literal("SUBMIT_REQUEST"), requestId: id, draft: draftFull }),

  z.object({ type: z.literal("CANCEL_REQUEST"), requestId: id }),
  z.object({
    type: z.literal("ACCEPT_QUOTE"),
    quoteId: id,
    bookingId: id,
    paymentId: id,
  }),
  z.object({ type: z.literal("DECLINE_QUOTE"), quoteId: id }),
  z.object({ type: z.literal("CONFIRM_BOOKING"), bookingId: id, method: paymentMethod }),
  z.object({ type: z.literal("CANCEL_BOOKING"), bookingId: id, reason: z.string().max(500) }),
  z.object({
    type: z.literal("RESCHEDULE_BOOKING"),
    bookingId: id,
    date: timestamp,
    slot: z.string().max(40),
  }),
  z.object({
    type: z.literal("SUBMIT_REVIEW"),
    bookingId: id,
    reviewId: id,
    rating: z.number().int().min(1).max(5),
    body: z.string().trim().max(2000),
  }),

  z.object({ type: z.literal("ADD_ADDRESS"), address }),
  z.object({ type: z.literal("UPDATE_ADDRESS"), addressId: id, patch: address.partial() }),
  z.object({ type: z.literal("DELETE_ADDRESS"), addressId: id }),
  z.object({ type: z.literal("SET_DEFAULT_ADDRESS"), addressId: id }),

  z.object({
    type: z.literal("ADD_PAYOUT_METHOD"),
    id,
    kind: paymentMethod,
    label: bnText(60),
    reference: z.string().max(60),
  }),
  z.object({ type: z.literal("DELETE_PAYOUT_METHOD"), id }),
  z.object({
    type: z.literal("UPDATE_CUSTOMER_PROFILE"),
    patch: z
      .object({
        bnName: bnText(80),
        phone: z.string().max(20),
        email: z.string().max(120),
      })
      .partial(),
  }),

  z.object({
    type: z.literal("ACCEPT_REQUEST"),
    requestId: id,
    quoteId: id,
    threadId: id,
    messageId: id,
    amount: money.refine((n) => n > 0, "দর শূন্যের বেশি হতে হবে"),
    message: bnText(2000),
    estimatedMinutes: minutes,
  }),
  z.object({ type: z.literal("DECLINE_REQUEST"), requestId: id }),
  z.object({ type: z.literal("WITHDRAW_QUOTE"), quoteId: id }),
  z.object({ type: z.literal("START_JOB"), bookingId: id }),
  z.object({ type: z.literal("COMPLETE_JOB"), bookingId: id }),
  z.object({ type: z.literal("SET_BOOKING_STATUS"), bookingId: id, status: bookingStatus }),

  z.object({ type: z.literal("TOGGLE_SERVICE_OFFERED"), categoryId: id }),
  z.object({ type: z.literal("UPDATE_SERVICE_PRICE"), categoryId: id, price: money }),
  z.object({
    type: z.literal("SET_AVAILABILITY_SLOT"),
    weekday: z.number().int().min(0).max(6),
    slot: z.string().max(40),
  }),
  z.object({
    type: z.literal("BULK_SET_AVAILABILITY"),
    weekday: z.number().int().min(0).max(6),
    slots: z.array(z.string().max(40)).max(24),
  }),
  z.object({
    type: z.literal("UPDATE_PROVIDER_PROFILE"),
    patch: z
      .object({
        bnTitle: bnText(120),
        bnBio: z.string().max(3000),
        priceFrom: money,
      })
      .partial(),
  }),
  z.object({ type: z.literal("SUBMIT_VERIFICATION_DOC"), kind: z.string().max(40) }),
  z.object({ type: z.literal("REQUEST_PAYOUT") }),

  z.object({
    type: z.literal("SEND_MESSAGE"),
    threadId: id,
    messageId: id,
    body: bnText(4000),
    role: z.enum(["customer", "provider"]),
    sentAt: timestamp,
  }),
  z.object({ type: z.literal("MARK_THREAD_READ"), threadId: id }),

  z.object({ type: z.literal("APPROVE_VERIFICATION"), verificationId: id, at: timestamp }),
  z.object({
    type: z.literal("REJECT_VERIFICATION"),
    verificationId: id,
    note: z.string().max(1000),
    at: timestamp,
  }),
  z.object({
    type: z.literal("SUSPEND_USER"),
    id,
    kind: z.enum(["customer", "provider"]),
  }),
  z.object({
    type: z.literal("REINSTATE_USER"),
    id,
    kind: z.enum(["customer", "provider"]),
  }),
  z.object({ type: z.literal("HIDE_REVIEW"), reviewId: id }),
  z.object({ type: z.literal("RESTORE_REVIEW"), reviewId: id }),
  z.object({
    type: z.literal("RESOLVE_DISPUTE"),
    disputeId: id,
    resolution: z.string().max(2000),
    at: timestamp,
  }),
  z.object({ type: z.literal("REFUND_PAYMENT"), paymentId: id }),
  z.object({ type: z.literal("TOGGLE_CATEGORY_ACTIVE"), categoryId: id }),
  z.object({ type: z.literal("TOGGLE_AREA_ACTIVE"), areaId: id }),
]);

export const PhoneSchema = z.string().min(10).max(20);
export const OtpCodeSchema = z.string().regex(/^\d{6}$/, "৬ সংখ্যার কোড দিন");
export const NameSchema = z.string().trim().min(1).max(80).optional();
