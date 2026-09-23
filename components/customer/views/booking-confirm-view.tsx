"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ErrorState } from "@/components/ui/error-state";
import { CategoryIcon } from "@/components/domain/category-icon";
import { VerifiedBadge } from "@/components/domain/verified-badge";
import { BookingCardSkeleton } from "@/components/skeletons";
import {
  useAddresses,
  useAreaById,
  useBookingById,
  useCategoryById,
  useProviderById,
} from "@/lib/api/queries";
import { useMutations } from "@/lib/api/mutations";
import { formatBdt, formatDate, formatDuration } from "@/lib/format";
import { ACTIONS, PAYMENT_METHOD_BN, SLOT_LABEL } from "@/lib/strings";
import type { PaymentMethodKind } from "@/lib/types";

const METHODS: { value: PaymentMethodKind; hint: string }[] = [
  { value: "bkash", hint: "কাজ শেষে পরিশোধ" },
  { value: "nagad", hint: "কাজ শেষে পরিশোধ" },
  { value: "cash", hint: "সরাসরি হাতে" },
  { value: "card", hint: "ভিসা / মাস্টারকার্ড" },
];

/**
 * The confirm step a customer lands on straight after accepting a quote.
 * Everything is already decided; this is the review-and-pay screen.
 */
export function BookingConfirmView({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { data: booking, isLoading, error, refetch } = useBookingById(bookingId);
  const { data: provider } = useProviderById(booking?.providerId ?? null);
  const { data: category } = useCategoryById(booking?.categoryId ?? null);
  const { data: area } = useAreaById(booking?.areaId ?? null);
  const { data: addresses } = useAddresses();
  const { confirmBooking } = useMutations();

  const [method, setMethod] = useState<PaymentMethodKind>("bkash");
  const [pending, setPending] = useState(false);

  if (isLoading) return <BookingCardSkeleton />;
  if (error || !booking) return <ErrorState onRetry={refetch} />;

  const address = (addresses ?? []).find((a) => a._id === booking.addressId);

  async function confirm() {
    if (!booking) return;
    setPending(true);
    try {
      await confirmBooking(booking._id, method);
      router.push(`/customer/bookings/${booking._id}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-fg md:text-3xl">বুকিং নিশ্চিত করুন</h1>
        <p className="text-base text-fg-secondary">
          সব ঠিক থাকলে নিশ্চিত করুন — ঘরলি টিম পেশাদারকে জানিয়ে দেবে।
        </p>
      </div>

      {/* service */}
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-fg">সেবা</h2>
        <div className="flex items-start gap-4">
          {category && <CategoryIcon icon={category.icon} tint={category.tint} size="lg" />}
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium text-fg">{booking.bnTitle}</p>
            <p className="text-sm text-fg-tertiary">
              {category?.bnShortName} · আনুমানিক {formatDuration(booking.durationMinutes)}
            </p>
          </div>
        </div>
      </section>

      {/* provider */}
      {provider && (
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-fg">পেশাদার</h2>
          <div className="flex items-center gap-3.5">
            <Avatar id={provider._id} name={provider.bnName} size="lg" />
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-2 text-base font-semibold text-fg">
                {provider.bnName}
                {provider.isVerified && <VerifiedBadge size="sm" />}
              </span>
              <span className="text-sm text-fg-tertiary">{provider.bnTitle}</span>
            </div>
          </div>
        </section>
      )}

      {/* when + where */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6">
          <h2 className="flex items-center gap-2 text-sm font-medium text-fg-tertiary">
            <Calendar aria-hidden="true" className="size-4" />
            সময়
          </h2>
          <p className="text-base font-medium text-fg">
            {formatDate(booking.scheduledDate, "long")}
          </p>
          <p className="text-sm text-fg-secondary">
            {SLOT_LABEL[booking.scheduledSlot] ?? booking.scheduledSlot}
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6">
          <h2 className="flex items-center gap-2 text-sm font-medium text-fg-tertiary">
            <MapPin aria-hidden="true" className="size-4" />
            ঠিকানা
          </h2>
          <p className="text-base font-medium text-fg">
            {address?.bnLabel ?? area?.bnName}
          </p>
          <p className="text-sm text-fg-secondary">
            {address ? `${address.bnLine1}, ${address.bnLine2}` : "চট্টগ্রাম"}
          </p>
        </div>
      </section>

      {/* payment */}
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-fg">
          <Wallet aria-hidden="true" className="size-5 text-fg-tertiary" />
          পেমেন্ট মাধ্যম
        </h2>

        <fieldset>
          <legend className="sr-only">পেমেন্ট মাধ্যম বেছে নিন</legend>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {METHODS.map((m) => {
              const on = method === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setMethod(m.value)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-lg border p-4 text-start",
                    "transition-[border-color,background-color,box-shadow] duration-(--duration-fast)",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                    on
                      ? "border-teal-600 bg-teal-50/60 shadow-focus"
                      : "border-border bg-surface hover:border-border-strong",
                  )}
                >
                  <span className="text-sm font-medium text-fg">
                    {PAYMENT_METHOD_BN[m.value]}
                  </span>
                  <span className="text-xs text-fg-tertiary">{m.hint}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <Separator />

        <dl className="flex flex-col gap-3">
          {/* One price: what the team quoted. How it splits between the professional
              and the platform is between the team and the professional. */}
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-base font-semibold text-fg">সর্বমোট</dt>
            <dd className="text-2xl font-extrabold tabular text-fg">
              {formatBdt(booking.amount)}
            </dd>
          </div>
        </dl>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" size="lg" onClick={() => router.back()}>
          {ACTIONS.back}
        </Button>
        <Button size="lg" loading={pending} onClick={confirm}>
          {ACTIONS.confirmBooking}
        </Button>
      </div>
    </div>
  );
}
