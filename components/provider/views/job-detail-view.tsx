"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CircleCheck,
  MapPin,
  MessageSquare,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorState } from "@/components/ui/error-state";
import { CategoryIcon } from "@/components/domain/category-icon";
import { BookingCardSkeleton } from "@/components/skeletons";
import {
  useAddresses,
  useAreaById,
  useBookingById,
  useCategoryById,
  useCustomerById,
} from "@/lib/api/queries";
import { useMutations } from "@/lib/api/mutations";
import { formatBdt, formatDate, formatDuration, formatPhone } from "@/lib/format";
import { ACTIONS, SLOT_LABEL } from "@/lib/strings";
import type { BookingStatus } from "@/lib/types";

/** The three states a job moves through, shown as a timeline. */
const TIMELINE: { status: BookingStatus; label: string }[] = [
  { status: "upcoming", label: "নির্ধারিত" },
  { status: "active", label: "চলমান" },
  { status: "completed", label: "সম্পন্ন" },
];

export function ProviderJobDetailView({ bookingId }: { bookingId: string }) {
  const { data: booking, isLoading, error, refetch } = useBookingById(bookingId);
  const { data: customer } = useCustomerById(booking?.customerId ?? null);
  const { data: category } = useCategoryById(booking?.categoryId ?? null);
  const { data: area } = useAreaById(booking?.areaId ?? null);
  const { data: addresses } = useAddresses(booking?.customerId);
  const { startJob, completeJob } = useMutations();
  const [pending, setPending] = useState(false);

  if (isLoading) return <BookingCardSkeleton />;
  if (error || !booking) return <ErrorState onRetry={refetch} />;

  const address = (addresses ?? []).find((a) => a._id === booking.addressId);
  const stageIndex = TIMELINE.findIndex((t) => t.status === booking.status);
  // The customer's phone only becomes visible once the booking is confirmed.
  const canSeePhone = booking.status !== "cancelled";

  async function run(fn: (id: string) => Promise<void>) {
    if (!booking) return;
    setPending(true);
    try {
      await fn(booking._id);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "ড্যাশবোর্ড", href: "/provider" },
          { label: "কাজ", href: "/provider/jobs" },
          { label: booking.bnTitle, href: `/provider/jobs/${booking._id}` },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:gap-8">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                {category && (
                  <CategoryIcon icon={category.icon} tint={category.tint} size="lg" />
                )}
                <div className="flex min-w-0 flex-col gap-1">
                  <h1 className="text-xl font-bold text-fg md:text-2xl">
                    {booking.bnTitle}
                  </h1>
                  <p className="text-sm text-fg-tertiary">{category?.bnShortName}</p>
                </div>
              </div>
              <StatusBadge domain="booking" status={booking.status} size="lg" />
            </div>

            <Separator />

            {/* progress */}
            {booking.status !== "cancelled" && (
              <ol className="flex items-center gap-2">
                {TIMELINE.map((stage, i) => {
                  const done = i <= stageIndex;
                  return (
                    <li key={stage.status} className="flex flex-1 items-center gap-2">
                      <span
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold",
                          done ? "bg-teal-600 text-white" : "bg-ink-100 text-fg-tertiary",
                        )}
                      >
                        {done ? (
                          <CircleCheck aria-hidden="true" className="size-4" />
                        ) : (
                          <span aria-hidden="true">·</span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-xs",
                          done ? "font-medium text-fg" : "text-fg-tertiary",
                        )}
                      >
                        {stage.label}
                      </span>
                      {i < TIMELINE.length - 1 && (
                        <span
                          aria-hidden="true"
                          className={cn(
                            "h-px flex-1",
                            i < stageIndex ? "bg-teal-600" : "bg-border",
                          )}
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            )}

            <Separator />

            <dl className="grid gap-5 sm:grid-cols-2">
              <div className="flex gap-3">
                <Calendar aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-fg-tertiary" />
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-fg-tertiary">সময়</dt>
                  <dd className="text-sm font-medium text-fg">
                    {formatDate(booking.scheduledDate, "long")}
                  </dd>
                  <dd className="text-sm text-fg-secondary">
                    {SLOT_LABEL[booking.scheduledSlot] ?? booking.scheduledSlot}
                  </dd>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-fg-tertiary" />
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-fg-tertiary">ঠিকানা</dt>
                  <dd className="text-sm font-medium text-fg">
                    {address ? `${address.bnLine1}, ${address.bnLine2}` : area?.bnName}
                  </dd>
                  <dd className="text-sm text-fg-secondary">{area?.bnName}, চট্টগ্রাম</dd>
                </div>
              </div>
            </dl>
          </section>

          {/* customer */}
          {customer && (
            <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
              <h2 className="text-lg font-semibold text-fg">গ্রাহক</h2>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <Avatar id={customer._id} name={customer.bnName} size="lg" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-base font-semibold text-fg">
                      {customer.bnName}
                    </span>
                    {canSeePhone && (
                      <span className="text-sm tabular text-fg-secondary">
                        {formatPhone(customer.phone)}
                      </span>
                    )}
                  </div>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link href="/provider/messages">
                    <MessageSquare aria-hidden="true" />
                    {ACTIONS.sendMessage}
                  </Link>
                </Button>
              </div>
            </section>
          )}
        </div>

        {/* rail */}
        <aside className="flex h-fit flex-col gap-5 rounded-xl border border-border bg-surface p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold text-fg">আপনার আয়</h2>

          <dl className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-sm text-fg-secondary">কাজের দাম</dt>
              <dd className="text-sm font-medium tabular text-fg">
                {formatBdt(booking.amount)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-sm text-fg-secondary">প্ল্যাটফর্ম কমিশন</dt>
              <dd className="text-sm font-medium tabular text-danger-600">
                −{formatBdt(booking.commission)}
              </dd>
            </div>
            <Separator />
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-base font-semibold text-fg">আপনি পাবেন</dt>
              <dd className="text-xl font-extrabold tabular text-fg">
                {formatBdt(booking.amount - booking.commission)}
              </dd>
            </div>
          </dl>

          <p className="text-xs tabular text-fg-tertiary">
            আনুমানিক সময় {formatDuration(booking.durationMinutes)}
          </p>

          <div className="flex flex-col gap-2.5 border-t border-border-subtle pt-4">
            {booking.status === "upcoming" && (
              <Button block loading={pending} onClick={() => void run(startJob)}>
                <PlayCircle aria-hidden="true" />
                {ACTIONS.startJob}
              </Button>
            )}
            {booking.status === "active" && (
              <Button block loading={pending} onClick={() => void run(completeJob)}>
                <CircleCheck aria-hidden="true" />
                {ACTIONS.completeJob}
              </Button>
            )}
            <Button asChild variant="ghost" block>
              <Link href="/provider/jobs">সব কাজ</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
