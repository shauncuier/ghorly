"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Inbox,
  PlayCircle,
  ReceiptText,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriceDisplay } from "@/components/ui/price-display";
import { Rating } from "@/components/ui/rating";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/app-shell/app-shell";
import { RequestCard } from "@/components/domain/request-card";
import { BookingCard } from "@/components/domain/booking-card";
import { QuoteComposer } from "@/components/provider/quote-composer";
import {
  BookingCardSkeleton,
  ListSkeleton,
  ReviewSkeleton,
} from "@/components/skeletons";
import {
  useCurrentProvider,
  useCustomerById,
  useOpenRequestsForProvider,
  useProviderBookings,
  useProviderQuotes,
  useRequestById,
  useReviewsForProvider,
} from "@/lib/api/queries";
import { useMutations } from "@/lib/api/mutations";
import { formatCount, formatDuration } from "@/lib/format";
import { RelativeTime } from "@/components/ui/relative-time";
import { ACTIONS, EMPTY } from "@/lib/strings";
import type { Quote, ServiceRequest } from "@/lib/types";

/* ==========================================================================
   Requests
   ========================================================================== */

export function ProviderRequestsView() {
  const { data: requests, isLoading, error, refetch } = useOpenRequestsForProvider();
  const { declineRequest } = useMutations();
  const [composing, setComposing] = useState<ServiceRequest | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);

  async function decline(id: string) {
    setDecliningId(id);
    try {
      await declineRequest(id);
    } finally {
      setDecliningId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="নতুন অনুরোধ"
        description="আপনার সেবা ও এলাকার সাথে মিলে যাওয়া কাজের অনুরোধ।"
      />

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <ListSkeleton count={4} />
      ) : (requests ?? []).length === 0 ? (
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState {...EMPTY.providerRequests} icon={<Inbox />} />
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {(requests ?? []).map((request) => (
            <RequestCard
              key={request._id}
              request={request}
              perspective="provider"
              actions={
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={decliningId === request._id}
                    onClick={() => void decline(request._id)}
                  >
                    {ACTIONS.decline}
                  </Button>
                  <Button size="sm" onClick={() => setComposing(request)}>
                    {ACTIONS.accept}
                  </Button>
                </div>
              }
            />
          ))}
        </div>
      )}

      {composing && (
        <QuoteComposer
          request={composing}
          open={composing !== null}
          onOpenChange={(open) => !open && setComposing(null)}
        />
      )}
    </>
  );
}

/* ==========================================================================
   Quotes
   ========================================================================== */

export function ProviderQuotesView() {
  const { data: quotes, isLoading, error, refetch } = useProviderQuotes();
  const all = quotes ?? [];

  const TABS = [
    { value: "sent", label: "পাঠানো", match: ["sent"] },
    { value: "accepted", label: "গৃহীত", match: ["accepted"] },
    { value: "closed", label: "বন্ধ", match: ["declined", "withdrawn"] },
  ];

  return (
    <>
      <PageHeader title="কোটেশন" description="আপনার পাঠানো দর ও তার ফলাফল।" />

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <ListSkeleton count={3} />
      ) : (
        <Tabs defaultValue="sent">
          <TabsList className="mb-6">
            {TABS.map((tab) => {
              const count = all.filter((q) => tab.match.includes(q.status)).length;
              return (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                  <span className="tabular text-fg-tertiary">({formatCount(count)})</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {TABS.map((tab) => {
            const rows = all.filter((q) => tab.match.includes(q.status));
            return (
              <TabsContent key={tab.value} value={tab.value}>
                {rows.length === 0 ? (
                  <div className="rounded-lg border border-border bg-surface">
                    <EmptyState {...EMPTY.providerQuotes} icon={<ReceiptText />} />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {rows.map((q) => (
                      <ProviderQuoteRow key={q._id} quote={q} />
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </>
  );
}

function ProviderQuoteRow({ quote }: { quote: Quote }) {
  const { data: request } = useRequestById(quote.requestId);
  const { data: customer } = useCustomerById(quote.customerId);
  const { withdrawQuote } = useMutations();
  const [pending, setPending] = useState(false);

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-base font-semibold text-fg">{request?.bnTitle}</h3>
          <p className="text-sm text-fg-tertiary">
            গ্রাহক: {customer?.bnName} · <RelativeTime value={quote.createdAt} />
          </p>
        </div>
        <StatusBadge domain="quote" status={quote.status} />
      </div>

      <p className="rounded-md bg-surface-muted px-4 py-3 text-sm text-fg-secondary">
        {quote.bnMessage}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-3">
        <span className="flex items-center gap-4">
          <PriceDisplay amount={quote.amount} size="md" />
          <span className="text-xs tabular text-fg-tertiary">
            {formatDuration(quote.estimatedMinutes)}
          </span>
        </span>

        {quote.status === "sent" && (
          <Button
            variant="ghost"
            size="sm"
            loading={pending}
            onClick={async () => {
              setPending(true);
              try {
                await withdrawQuote(quote._id);
              } finally {
                setPending(false);
              }
            }}
          >
            {ACTIONS.withdrawQuote}
          </Button>
        )}
      </div>
    </article>
  );
}

/* ==========================================================================
   Jobs
   ========================================================================== */

export function ProviderJobsView() {
  const { data: bookings, isLoading, error, refetch } = useProviderBookings();
  const { startJob, completeJob } = useMutations();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const all = bookings ?? [];

  const TABS = [
    { value: "active", label: "চলমান", match: ["upcoming", "active"] },
    { value: "completed", label: "সম্পন্ন", match: ["completed"] },
    { value: "cancelled", label: "বাতিল", match: ["cancelled"] },
  ];

  async function run(id: string, fn: (id: string) => Promise<void>) {
    setPendingId(id);
    try {
      await fn(id);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <PageHeader title="কাজ" description="আপনার গৃহীত ও সম্পন্ন কাজের তালিকা।" />

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex flex-col gap-4">
          <BookingCardSkeleton />
          <BookingCardSkeleton />
        </div>
      ) : (
        <Tabs defaultValue="active">
          <TabsList className="mb-6">
            {TABS.map((tab) => {
              const count = all.filter((b) => tab.match.includes(b.status)).length;
              return (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                  <span className="tabular text-fg-tertiary">({formatCount(count)})</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {TABS.map((tab) => {
            const rows = all.filter((b) => tab.match.includes(b.status));
            return (
              <TabsContent key={tab.value} value={tab.value}>
                {rows.length === 0 ? (
                  <div className="rounded-lg border border-border bg-surface">
                    <EmptyState {...EMPTY.providerJobs} icon={<BriefcaseBusiness />} />
                  </div>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {rows.map((booking) => (
                      <BookingCard
                        key={booking._id}
                        booking={booking}
                        perspective="provider"
                        actions={
                          booking.status === "upcoming" ? (
                            <Button
                              size="sm"
                              loading={pendingId === booking._id}
                              onClick={() => void run(booking._id, startJob)}
                            >
                              <PlayCircle aria-hidden="true" />
                              {ACTIONS.startJob}
                            </Button>
                          ) : booking.status === "active" ? (
                            <Button
                              size="sm"
                              loading={pendingId === booking._id}
                              onClick={() => void run(booking._id, completeJob)}
                            >
                              {ACTIONS.completeJob}
                            </Button>
                          ) : undefined
                        }
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </>
  );
}

/* ==========================================================================
   Reviews
   ========================================================================== */

export function ProviderReviewsView() {
  const { data: provider } = useCurrentProvider();
  const { data: reviews, isLoading, error, refetch } = useReviewsForProvider(
    provider?._id ?? null,
  );

  return (
    <>
      <PageHeader
        title="রিভিউ"
        description="গ্রাহকরা আপনার কাজ নিয়ে যা বলেছেন।"
        action={
          provider && (
            <div className="flex flex-col items-end gap-1">
              <Rating value={provider.rating} size="md" />
              <span className="text-xs tabular text-fg-tertiary">
                {formatCount(provider.reviewCount, "রিভিউ")}
              </span>
            </div>
          )
        }
      />

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex flex-col gap-4">
          <ReviewSkeleton />
          <ReviewSkeleton />
        </div>
      ) : (reviews ?? []).length === 0 ? (
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState {...EMPTY.providerReviews} icon={<Star />} />
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {(reviews ?? []).map((r) => (
            <li
              key={r._id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm tabular text-fg-tertiary">
                  <RelativeTime value={r.createdAt} />
                </span>
                <Rating value={r.rating} size="sm" starsOnly />
              </div>
              <p className="text-sm text-fg-secondary">{r.bnBody}</p>
              {r.bnProviderReply ? (
                <div className="rounded-md border-s-2 border-teal-300 bg-surface-muted px-4 py-3">
                  <p className="mb-1 text-xs font-medium text-fg-tertiary">আপনার উত্তর</p>
                  <p className="text-sm text-fg-secondary">{r.bnProviderReply}</p>
                </div>
              ) : (
                <Button asChild variant="ghost" size="sm" className="w-fit">
                  <Link href="/provider/messages">উত্তর দিন</Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
