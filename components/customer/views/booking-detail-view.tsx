"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  MessageSquare,
  Receipt,
  TriangleAlert,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorState } from "@/components/ui/error-state";
import { Rating } from "@/components/ui/rating";
import { Textarea } from "@/components/ui/textarea";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { CategoryIcon } from "@/components/domain/category-icon";
import { VerifiedBadge } from "@/components/domain/verified-badge";
import { BookingCardSkeleton } from "@/components/skeletons";
import {
  useAreaById,
  useBookingById,
  useCategoryById,
  useProviderById,
} from "@/lib/api/queries";
import { useMutations } from "@/lib/api/mutations";
import {
  formatBdt,
  formatDate,
  formatDuration,
  toBn,
} from "@/lib/format";
import { ACTIONS, PAYMENT_METHOD_BN, SLOT_LABEL } from "@/lib/strings";

const STAR_VALUES = [1, 2, 3, 4, 5];

export function BookingDetailView({ bookingId }: { bookingId: string }) {
  const { data: booking, isLoading, error, refetch } = useBookingById(bookingId);
  const { data: provider } = useProviderById(booking?.providerId ?? null);
  const { data: category } = useCategoryById(booking?.categoryId ?? null);
  const { data: area } = useAreaById(booking?.areaId ?? null);
  const { cancelBooking, submitReview } = useMutations();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [pending, setPending] = useState(false);

  if (isLoading) return <BookingCardSkeleton />;
  if (error || !booking) return <ErrorState onRetry={refetch} />;

  async function cancel() {
    if (!booking) return;
    setPending(true);
    try {
      await cancelBooking(booking._id, reason || "গ্রাহক বাতিল করেছেন");
      setCancelOpen(false);
    } finally {
      setPending(false);
    }
  }

  async function review() {
    if (!booking) return;
    setPending(true);
    try {
      await submitReview(booking._id, rating, reviewBody);
      setReviewOpen(false);
    } finally {
      setPending(false);
    }
  }

  const canCancel = booking.status === "upcoming";
  const canReview = booking.status === "completed" && !booking.reviewId;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "ড্যাশবোর্ড", href: "/customer" },
          { label: "বুকিং", href: "/customer/bookings" },
          { label: booking.bnTitle, href: `/customer/bookings/${booking._id}` },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:gap-8">
        <div className="flex flex-col gap-6">
          {/* header */}
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
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
                  <dt className="text-xs text-fg-tertiary">এলাকা</dt>
                  <dd className="text-sm font-medium text-fg">{area?.bnName}</dd>
                  <dd className="text-sm text-fg-secondary">চট্টগ্রাম</dd>
                </div>
              </div>

              <div className="flex gap-3">
                <Receipt aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-fg-tertiary" />
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-fg-tertiary">আনুমানিক সময়</dt>
                  <dd className="text-sm font-medium tabular text-fg">
                    {formatDuration(booking.durationMinutes)}
                  </dd>
                </div>
              </div>

              <div className="flex gap-3">
                <Receipt aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-fg-tertiary" />
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-fg-tertiary">বুকিং নম্বর</dt>
                  <dd className="font-latin text-sm font-medium text-fg" lang="en">
                    {booking._id}
                  </dd>
                </div>
              </div>
            </dl>

            {booking.bnCancelReason && (
              <p className="flex items-start gap-2.5 rounded-md bg-danger-50 px-4 py-3 text-sm text-danger-700">
                <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                বাতিলের কারণ: {booking.bnCancelReason}
              </p>
            )}
          </div>

          {/* provider */}
          {provider && (
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
              <h2 className="text-lg font-semibold text-fg">পেশাদার</h2>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <Avatar id={provider._id} name={provider.bnName} size="lg" />
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-2 text-base font-semibold text-fg">
                      {provider.bnName}
                      {provider.isVerified && <VerifiedBadge size="sm" />}
                    </span>
                    <span className="text-sm text-fg-tertiary">{provider.bnTitle}</span>
                    <Rating value={provider.rating} reviewCount={provider.reviewCount} size="sm" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="secondary" size="sm">
                    {/* No direct line to the professional: the team relays. */}
                    <Link href="/customer/messages">
                      <MessageSquare aria-hidden="true" />
                      ঘরলি টিমকে লিখুন
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/providers/${provider.slug}`}>{ACTIONS.viewProfile}</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ---------- summary rail ---------- */}
        <aside className="flex h-fit flex-col gap-5 rounded-xl border border-border bg-surface p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold text-fg">খরচের হিসাব</h2>

          <dl className="flex flex-col gap-3">
            {/* One price: what the team quoted. How it splits between the professional
                and the platform is between the team and the professional. */}
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-base font-semibold text-fg">মোট</dt>
              <dd className="text-xl font-extrabold tabular text-fg">
                {formatBdt(booking.amount)}
              </dd>
            </div>
          </dl>

          <p className="rounded-md bg-surface-muted px-3.5 py-2.5 text-xs text-fg-tertiary">
            {PAYMENT_METHOD_BN.bkash}, {PAYMENT_METHOD_BN.nagad} বা নগদ অর্থে
            কাজ শেষে পরিশোধ করতে পারবেন।
          </p>

          <div className="flex flex-col gap-2.5">
            {canReview && (
              <Button block onClick={() => setReviewOpen(true)}>
                {ACTIONS.writeReview}
              </Button>
            )}
            {canCancel && (
              <Button variant="secondary" block onClick={() => setCancelOpen(true)}>
                {ACTIONS.cancel}
              </Button>
            )}
            <Button asChild variant="ghost" block>
              <Link href="/customer/bookings">সব বুকিং</Link>
            </Button>
          </div>
        </aside>
      </div>

      {/* ---------- cancel modal ---------- */}
      <Modal open={cancelOpen} onOpenChange={setCancelOpen}>
        <ModalContent size="sm">
          <ModalHeader>
            <ModalTitle>বুকিং বাতিল করবেন?</ModalTitle>
            <ModalDescription>
              নির্ধারিত সময়ের ২৪ ঘণ্টা আগে বাতিল করলে কোনো চার্জ নেই।
            </ModalDescription>
          </ModalHeader>
          <ModalBody>
            <Textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="কারণ লিখুন (ঐচ্ছিক)"
              aria-label="বাতিলের কারণ"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>
              ফিরে যান
            </Button>
            <Button variant="danger" loading={pending} onClick={cancel}>
              {ACTIONS.cancel}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ---------- review modal ---------- */}
      <Modal open={reviewOpen} onOpenChange={setReviewOpen}>
        <ModalContent size="sm">
          <ModalHeader>
            <ModalTitle>কাজটি কেমন হয়েছে?</ModalTitle>
            <ModalDescription>
              আপনার মতামত পরের গ্রাহককে সিদ্ধান্ত নিতে সাহায্য করবে।
            </ModalDescription>
          </ModalHeader>
          <ModalBody className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium text-fg">রেটিং</legend>
              <div className="flex gap-1.5">
                {STAR_VALUES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={rating === v}
                    aria-label={`${toBn(v)} তারা`}
                    onClick={() => setRating(v)}
                    className="rounded-md p-1 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className={
                        v <= rating ? "size-8 text-warning-500" : "size-8 text-ink-200"
                      }
                      aria-hidden="true"
                    >
                      <path
                        d="M12 2.6l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.42l-5.8 3.05 1.1-6.46-4.69-4.58 6.49-.94L12 2.6z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            </fieldset>

            <Textarea
              rows={4}
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
              placeholder="আপনার অভিজ্ঞতা লিখুন…"
              aria-label="রিভিউ"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setReviewOpen(false)}>
              পরে দেব
            </Button>
            <Button loading={pending} onClick={review}>
              {ACTIONS.submit}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
