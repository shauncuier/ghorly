"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppState } from "@/lib/store/context";
import { nextId } from "@/lib/store/initial-state";
import { delay, LATENCY } from "@/lib/api/latency";
import { toast } from "@/lib/toast";
// Real clock: these are write paths (event handlers), never render.
import { currentNaiveLocal } from "@/lib/data/clock";
import type {
  Address,
  BookingStatus,
  PaymentMethodKind,
  RequestDraft,
  Role,
} from "@/lib/types";

/**
 * Every write in the app goes through this hook.
 *
 * All of them are `async` and awaited at the call site, even though the store
 * is synchronous, so components already disable their buttons while pending
 * and already handle a rejected promise. When these become `fetch('/api/…')`
 * calls, the UI does not change.
 *
 * Toasts are raised here rather than in components, so the same action always
 * announces itself the same way no matter which screen triggered it.
 */
export function useMutations() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const counters = state.ui.counters;
  // Read here so `submitRequest` can send the draft with the action —
  // the server keeps no draft of its own.
  const draft = state.ui.requestDraft;

  return {
    /* ---------------- session ---------------- */

    /**
     * Switches which role the session acts as.
     *
     * Goes to the server rather than just updating local state: the active
     * role lives in the signed session cookie, and the server refuses any role
     * the account does not hold. A full reload follows so every scoped query
     * re-fetches under the new role.
     */
    switchRole: useCallback(
      async (role: Exclude<Role, "guest">) => {
        const res = await fetch("/api/auth/switch-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          toast.error(body?.error?.message ?? "ভূমিকা বদলানো যায়নি।");
          return;
        }
        // Hard navigation on purpose: the session cookie just changed, so every
        // scoped query must refetch and all in-memory state must be discarded.
        // router.push() would keep the old client state under a new identity.
        window.location.href =
          role === "customer" ? "/customer" : role === "provider" ? "/provider" : "/admin";
      },
      [],
    ),

    signOut: useCallback(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      // Clear the offline cache too — it holds the previous user's scoped data.
      try {
        window.localStorage.removeItem("ghorly.state.v1");
      } catch {
        // no-op
      }
      // Hard navigation: signing out must drop every trace of the previous
      // user's state, which a client-side push would preserve.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    }, []),

    /** Development convenience only; the API refuses it in production. */
    resetDemo: useCallback(async () => {
      await delay(LATENCY.write);
      dispatch({ type: "RESET_DEMO" });
      toast.success("ডেমো ডেটা আবার শুরু থেকে সাজানো হয়েছে");
    }, [dispatch]),

    /* ---------------- favourites ---------------- */

    toggleFavorite: useCallback(
      async (providerId: string, name: string) => {
        const wasOn = state.ui.favorites.includes(providerId);
        dispatch({ type: "TOGGLE_FAVORITE", providerId });
        toast.success(
          wasOn ? "পছন্দের তালিকা থেকে সরানো হয়েছে" : "পছন্দের তালিকায় যোগ হয়েছে",
          { description: name, duration: 2200 },
        );
      },
      [dispatch, state.ui.favorites],
    ),

    /* ---------------- request wizard ---------------- */

    startDraft: useCallback(
      async (patch?: Partial<RequestDraft>) => {
        dispatch({ type: "DRAFT_START", patch });
      },
      [dispatch],
    ),

    patchDraft: useCallback(
      (patch: Partial<RequestDraft>) => {
        dispatch({ type: "DRAFT_PATCH", patch });
      },
      [dispatch],
    ),

    setDraftStep: useCallback(
      (step: number) => {
        dispatch({ type: "DRAFT_SET_STEP", step });
      },
      [dispatch],
    ),

    resetDraft: useCallback(() => {
      dispatch({ type: "DRAFT_RESET" });
    }, [dispatch]),

    submitRequest: useCallback(async () => {
      // Nothing to submit without a draft. The wizard guards this, but the
      // reducer would silently no-op and the toast would still claim success.
      if (!draft) return null;

      await delay(LATENCY.slowWrite);
      const requestId = nextId("req", counters);
      dispatch({ type: "SUBMIT_REQUEST", requestId, draft });
      toast.success("অনুরোধ পাঠানো হয়েছে", {
        description: "উপযুক্ত পেশাদাররা শীঘ্রই কোটেশন পাঠাবেন।",
      });
      return requestId;
    }, [dispatch, counters, draft]),

    cancelRequest: useCallback(
      async (requestId: string) => {
        await delay(LATENCY.write);
        dispatch({ type: "CANCEL_REQUEST", requestId });
        toast.success("অনুরোধ বাতিল হয়েছে");
      },
      [dispatch],
    ),

    /* ---------------- provider responds ---------------- */

    acceptRequest: useCallback(
      async (
        requestId: string,
        input: { amount: number; message: string; estimatedMinutes: number },
      ) => {
        await delay(LATENCY.write);
        const quoteId = nextId("quo", counters);
        const threadId = nextId("thr", counters);
        const messageId = nextId("msg", counters);

        dispatch({
          type: "ACCEPT_REQUEST",
          requestId,
          quoteId,
          threadId,
          messageId,
          ...input,
        });

        toast.success("কোটেশন পাঠানো হয়েছে", {
          description: "গ্রাহক গ্রহণ করলে কাজটি আপনার তালিকায় যুক্ত হবে।",
        });
        return quoteId;
      },
      [dispatch, counters],
    ),

    declineRequest: useCallback(
      async (requestId: string) => {
        await delay(LATENCY.write);
        dispatch({ type: "DECLINE_REQUEST", requestId });
        toast.info("অনুরোধটি আপনার তালিকা থেকে সরানো হয়েছে");
      },
      [dispatch],
    ),

    withdrawQuote: useCallback(
      async (quoteId: string) => {
        await delay(LATENCY.write);
        dispatch({ type: "WITHDRAW_QUOTE", quoteId });
        toast.success("কোটেশন প্রত্যাহার করা হয়েছে");
      },
      [dispatch],
    ),

    /* ---------------- customer decides ---------------- */

    acceptQuote: useCallback(
      async (quoteId: string) => {
        await delay(LATENCY.slowWrite);
        const bookingId = nextId("bkg", counters);
        const paymentId = nextId("pay", counters);
        dispatch({ type: "ACCEPT_QUOTE", quoteId, bookingId, paymentId });
        toast.success("কোটেশন গৃহীত হয়েছে", {
          description: "বুকিং নিশ্চিত করতে পরের ধাপে যান।",
        });
        return bookingId;
      },
      [dispatch, counters],
    ),

    declineQuote: useCallback(
      async (quoteId: string) => {
        await delay(LATENCY.write);
        dispatch({ type: "DECLINE_QUOTE", quoteId });
        toast.info("কোটেশন প্রত্যাখ্যান করা হয়েছে");
      },
      [dispatch],
    ),

    confirmBooking: useCallback(
      async (bookingId: string, method: PaymentMethodKind) => {
        await delay(LATENCY.slowWrite);
        dispatch({ type: "CONFIRM_BOOKING", bookingId, method });
        toast.success("বুকিং নিশ্চিত হয়েছে", {
          description: "নির্ধারিত সময়ে পেশাদার পৌঁছে যাবেন।",
        });
      },
      [dispatch],
    ),

    cancelBooking: useCallback(
      async (bookingId: string, reason: string) => {
        await delay(LATENCY.write);
        dispatch({ type: "CANCEL_BOOKING", bookingId, reason });
        toast.success("বুকিং বাতিল হয়েছে");
      },
      [dispatch],
    ),

    rescheduleBooking: useCallback(
      async (bookingId: string, date: string, slot: string) => {
        await delay(LATENCY.write);
        dispatch({ type: "RESCHEDULE_BOOKING", bookingId, date, slot });
        toast.success("সময় পরিবর্তন করা হয়েছে");
      },
      [dispatch],
    ),

    /* ---------------- the job ---------------- */

    startJob: useCallback(
      async (bookingId: string) => {
        await delay(LATENCY.write);
        dispatch({ type: "START_JOB", bookingId });
        toast.success("কাজ শুরু হয়েছে");
      },
      [dispatch],
    ),

    completeJob: useCallback(
      async (bookingId: string) => {
        await delay(LATENCY.slowWrite);
        dispatch({ type: "COMPLETE_JOB", bookingId });
        toast.success("কাজ সম্পন্ন হিসেবে চিহ্নিত হয়েছে", {
          description: "আয়ের হিসাবে যোগ হয়েছে।",
        });
      },
      [dispatch],
    ),

    setBookingStatus: useCallback(
      async (bookingId: string, status: BookingStatus) => {
        await delay(LATENCY.write);
        dispatch({ type: "SET_BOOKING_STATUS", bookingId, status });
        toast.success("অবস্থা পরিবর্তন করা হয়েছে");
      },
      [dispatch],
    ),

    submitReview: useCallback(
      async (bookingId: string, rating: number, body: string) => {
        await delay(LATENCY.write);
        const reviewId = nextId("rev", counters);
        dispatch({ type: "SUBMIT_REVIEW", bookingId, reviewId, rating, body });
        toast.success("রিভিউ জমা হয়েছে", { description: "ধন্যবাদ জানানোর জন্য।" });
        return reviewId;
      },
      [dispatch, counters],
    ),

    /* ---------------- addresses & payouts ---------------- */

    addAddress: useCallback(
      async (input: Omit<Address, "_id" | "createdAt" | "updatedAt" | "customerId">) => {
        await delay(LATENCY.write);
        const address: Address = {
          _id: nextId("adr", counters),
          customerId: state.session.customerId,
          createdAt: currentNaiveLocal(),
          updatedAt: currentNaiveLocal(),
          ...input,
        };
        dispatch({ type: "ADD_ADDRESS", address });
        toast.success("ঠিকানা যোগ হয়েছে");
        return address._id;
      },
      [dispatch, counters, state.session.customerId],
    ),

    updateAddress: useCallback(
      async (addressId: string, patch: Partial<Address>) => {
        await delay(LATENCY.write);
        dispatch({ type: "UPDATE_ADDRESS", addressId, patch });
        toast.success("ঠিকানা হালনাগাদ হয়েছে");
      },
      [dispatch],
    ),

    deleteAddress: useCallback(
      async (addressId: string) => {
        await delay(LATENCY.write);
        dispatch({ type: "DELETE_ADDRESS", addressId });
        toast.success("ঠিকানা মুছে ফেলা হয়েছে");
      },
      [dispatch],
    ),

    setDefaultAddress: useCallback(
      async (addressId: string) => {
        await delay(LATENCY.write);
        dispatch({ type: "SET_DEFAULT_ADDRESS", addressId });
        toast.success("প্রধান ঠিকানা নির্ধারণ করা হয়েছে");
      },
      [dispatch],
    ),

    addPayoutMethod: useCallback(
      async (kind: PaymentMethodKind, label: string, reference: string) => {
        await delay(LATENCY.write);
        const id = nextId("pom", counters);
        dispatch({ type: "ADD_PAYOUT_METHOD", id, kind, label, reference });
        toast.success("পেমেন্ট মাধ্যম যোগ হয়েছে");
        return id;
      },
      [dispatch, counters],
    ),

    deletePayoutMethod: useCallback(
      async (id: string) => {
        await delay(LATENCY.write);
        dispatch({ type: "DELETE_PAYOUT_METHOD", id });
        toast.success("পেমেন্ট মাধ্যম সরানো হয়েছে");
      },
      [dispatch],
    ),

    updateCustomerProfile: useCallback(
      async (patch: { bnName?: string; phone?: string; email?: string }) => {
        await delay(LATENCY.write);
        dispatch({ type: "UPDATE_CUSTOMER_PROFILE", patch });
        toast.success("প্রোফাইল হালনাগাদ হয়েছে");
      },
      [dispatch],
    ),

    /* ---------------- provider settings ---------------- */

    updateProviderProfile: useCallback(
      async (patch: { bnTitle?: string; bnBio?: string; priceFrom?: number }) => {
        await delay(LATENCY.write);
        dispatch({ type: "UPDATE_PROVIDER_PROFILE", patch });
        toast.success("প্রোফাইল হালনাগাদ হয়েছে");
      },
      [dispatch],
    ),

    toggleServiceOffered: useCallback(
      async (categoryId: string) => {
        dispatch({ type: "TOGGLE_SERVICE_OFFERED", categoryId });
      },
      [dispatch],
    ),

    updateServicePrice: useCallback(
      async (categoryId: string, price: number) => {
        await delay(LATENCY.write);
        dispatch({ type: "UPDATE_SERVICE_PRICE", categoryId, price });
        toast.success("দর হালনাগাদ হয়েছে");
      },
      [dispatch],
    ),

    setAvailabilitySlot: useCallback(
      (weekday: number, slot: string) => {
        dispatch({ type: "SET_AVAILABILITY_SLOT", weekday, slot });
      },
      [dispatch],
    ),

    bulkSetAvailability: useCallback(
      async (weekday: number, slots: string[]) => {
        dispatch({ type: "BULK_SET_AVAILABILITY", weekday, slots });
      },
      [dispatch],
    ),

    submitVerificationDoc: useCallback(
      async (kind: string) => {
        await delay(LATENCY.slowWrite);
        dispatch({ type: "SUBMIT_VERIFICATION_DOC", kind });
        toast.success("কাগজপত্র জমা হয়েছে", {
          description: "যাচাই সম্পন্ন হলে আমরা জানাব।",
        });
      },
      [dispatch],
    ),

    requestPayout: useCallback(
      async (amount: number) => {
        await delay(LATENCY.slowWrite);
        dispatch({ type: "REQUEST_PAYOUT" });
        toast.success("উত্তোলনের অনুরোধ জমা হয়েছে", {
          description: `৩ কর্মদিবসের মধ্যে টাকা পৌঁছে যাবে।`,
        });
        return amount;
      },
      [dispatch],
    ),

    /* ---------------- messaging ---------------- */

    sendMessage: useCallback(
      async (threadId: string, body: string, role: "customer" | "provider") => {
        const messageId = nextId("msg", counters);
        dispatch({ type: "SEND_MESSAGE", threadId, messageId, body, role, sentAt: currentNaiveLocal() });
        await delay(LATENCY.read);
        return messageId;
      },
      [dispatch, counters],
    ),

    markThreadRead: useCallback(
      (threadId: string) => {
        dispatch({ type: "MARK_THREAD_READ", threadId });
      },
      [dispatch],
    ),

    /* ---------------- admin ---------------- */

    approveVerification: useCallback(
      async (verificationId: string) => {
        await delay(LATENCY.write);
        dispatch({ type: "APPROVE_VERIFICATION", verificationId, at: currentNaiveLocal() });
        toast.success("যাচাই অনুমোদিত", {
          description: "পেশাদারের প্রোফাইলে যাচাইকৃত চিহ্ন যোগ হয়েছে।",
        });
      },
      [dispatch],
    ),

    rejectVerification: useCallback(
      async (verificationId: string, note: string) => {
        await delay(LATENCY.write);
        dispatch({ type: "REJECT_VERIFICATION", verificationId, note, at: currentNaiveLocal() });
        toast.success("যাচাই প্রত্যাখ্যাত");
      },
      [dispatch],
    ),

    suspendUser: useCallback(
      async (id: string, kind: "customer" | "provider") => {
        await delay(LATENCY.write);
        dispatch({ type: "SUSPEND_USER", id, kind });
        toast.success("অ্যাকাউন্ট স্থগিত করা হয়েছে");
      },
      [dispatch],
    ),

    reinstateUser: useCallback(
      async (id: string, kind: "customer" | "provider") => {
        await delay(LATENCY.write);
        dispatch({ type: "REINSTATE_USER", id, kind });
        toast.success("অ্যাকাউন্ট পুনর্বহাল করা হয়েছে");
      },
      [dispatch],
    ),

    hideReview: useCallback(
      async (reviewId: string) => {
        await delay(LATENCY.write);
        dispatch({ type: "HIDE_REVIEW", reviewId });
        toast.success("রিভিউ লুকানো হয়েছে");
      },
      [dispatch],
    ),

    restoreReview: useCallback(
      async (reviewId: string) => {
        await delay(LATENCY.write);
        dispatch({ type: "RESTORE_REVIEW", reviewId });
        toast.success("রিভিউ ফিরিয়ে আনা হয়েছে");
      },
      [dispatch],
    ),

    resolveDispute: useCallback(
      async (disputeId: string, resolution: string) => {
        await delay(LATENCY.write);
        dispatch({ type: "RESOLVE_DISPUTE", disputeId, resolution, at: currentNaiveLocal() });
        toast.success("বিরোধ নিষ্পত্তি হয়েছে");
      },
      [dispatch],
    ),

    refundPayment: useCallback(
      async (paymentId: string) => {
        await delay(LATENCY.slowWrite);
        dispatch({ type: "REFUND_PAYMENT", paymentId });
        toast.success("টাকা ফেরত দেওয়া হয়েছে");
      },
      [dispatch],
    ),

    toggleCategoryActive: useCallback(
      async (categoryId: string) => {
        dispatch({ type: "TOGGLE_CATEGORY_ACTIVE", categoryId });
      },
      [dispatch],
    ),

    toggleAreaActive: useCallback(
      async (areaId: string) => {
        dispatch({ type: "TOGGLE_AREA_ACTIVE", areaId });
      },
      [dispatch],
    ),
  };
}
