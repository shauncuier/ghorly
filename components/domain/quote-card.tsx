"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, MessageSquare } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriceDisplay } from "@/components/ui/price-display";
import { Rating } from "@/components/ui/rating";
import { VerifiedBadge } from "@/components/domain/verified-badge";
import { useProviderById, useRequestById } from "@/lib/api/queries";
import { useMutations } from "@/lib/api/mutations";
import { formatDuration } from "@/lib/format";
import { RelativeTime } from "@/components/ui/relative-time";
import { ACTIONS } from "@/lib/strings";
import type { Quote } from "@/lib/types";

/**
 * A quote as the customer sees it — who, how much, how long, and the two
 * decisions available. Accepting cascades: sibling quotes decline, a booking
 * and a pending payment appear, and the request flips to booked.
 */
export function QuoteCard({
  quote,
  className,
}: {
  quote: Quote;
  className?: string;
}) {
  const router = useRouter();
  const { data: provider } = useProviderById(quote.providerId);
  const { data: request } = useRequestById(quote.requestId);
  const { acceptQuote, declineQuote } = useMutations();
  const [pending, setPending] = useState<"accept" | "decline" | null>(null);

  const decidable = quote.status === "sent";

  async function accept() {
    setPending("accept");
    try {
      const bookingId = await acceptQuote(quote._id);
      router.push(`/customer/bookings/${bookingId}/confirm`);
    } finally {
      setPending(null);
    }
  }

  async function decline() {
    setPending("decline");
    try {
      await declineQuote(quote._id);
    } finally {
      setPending(null);
    }
  }

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-border bg-surface p-5",
        quote.status === "accepted" && "border-success-500/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3.5">
          <Avatar
            id={provider?._id ?? ""}
            name={provider?.bnName ?? ""}
            size="md"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-x-2">
              <h3 className="text-base font-semibold text-fg">
                <Link
                  href={`/providers/${provider?.slug ?? ""}`}
                  className="rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                >
                  {provider?.bnName}
                </Link>
              </h3>
              {provider?.isVerified && <VerifiedBadge size="sm" />}
            </div>
            <p className="truncate-bn text-sm text-fg-tertiary">{provider?.bnTitle}</p>
            {provider && (
              <Rating
                value={provider.rating}
                reviewCount={provider.reviewCount}
                size="sm"
                className="mt-1"
              />
            )}
          </div>
        </div>
        <StatusBadge domain="quote" status={quote.status} />
      </div>

      {request && (
        <p className="text-sm text-fg-tertiary">
          অনুরোধ: <span className="text-fg-secondary">{request.bnTitle}</span>
        </p>
      )}

      <p className="rounded-md bg-surface-muted px-4 py-3 text-sm text-fg-secondary">
        {quote.bnMessage}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border-subtle pt-4">
        <div className="flex flex-col gap-1">
          <PriceDisplay amount={quote.amount} size="lg" />
          <span className="flex items-center gap-1.5 text-xs tabular text-fg-tertiary">
            <Clock aria-hidden="true" className="size-3.5" />
            আনুমানিক {formatDuration(quote.estimatedMinutes)} ·{" "}
            <RelativeTime value={quote.createdAt} />
          </span>
        </div>

        {decidable ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              loading={pending === "decline"}
              disabled={pending !== null}
              onClick={decline}
            >
              {ACTIONS.decline}
            </Button>
            <Button
              size="sm"
              loading={pending === "accept"}
              disabled={pending !== null}
              onClick={accept}
            >
              {ACTIONS.accept}
            </Button>
          </div>
        ) : (
          <Button asChild variant="secondary" size="sm">
            <Link href="/customer/messages">
              <MessageSquare aria-hidden="true" />
              {ACTIONS.sendMessage}
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}
