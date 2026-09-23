"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CircleCheck,
  Inbox,
  Star,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Rating } from "@/components/ui/rating";
import { StatCard } from "@/components/app-shell/stat-card";
import { BookingCard } from "@/components/domain/booking-card";
import { RequestCard } from "@/components/domain/request-card";
import { QuoteComposer } from "@/components/provider/quote-composer";
import { ListSkeleton, StatCardSkeleton } from "@/components/skeletons";
import {
  useCurrentProvider,
  useOpenRequestsForProvider,
  useProviderBookings,
  useProviderEarnings,
  useProviderQuotes,
} from "@/lib/api/queries";
import { useMutations } from "@/lib/api/mutations";
import { formatBdt, formatCount, formatRating } from "@/lib/format";
import { ACTIONS, EMPTY } from "@/lib/strings";
import type { ServiceRequest } from "@/lib/types";

/**
 * The provider's home — a deliberately different shape from the customer's.
 *
 * A provider's first question is "what work is waiting for me", so the new
 * requests sit at the top and are actionable in place: accept opens the quote
 * composer, decline removes the row. No navigation needed to do the job.
 */
export function ProviderDashboardView() {
  const { data: provider, isLoading: loadingProvider } = useCurrentProvider();
  const { data: requests, isLoading: loadingRequests } = useOpenRequestsForProvider();
  const { data: quotes } = useProviderQuotes();
  const { data: upcoming } = useProviderBookings(["upcoming", "active"]);
  const { data: completed } = useProviderBookings(["completed"]);
  const { data: earnings } = useProviderEarnings();
  const { declineRequest } = useMutations();

  const [composing, setComposing] = useState<ServiceRequest | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);

  const openRequests = requests ?? [];
  const sentQuotes = (quotes ?? []).filter((q) => q.status === "sent");

  async function decline(id: string) {
    setDecliningId(id);
    try {
      await declineRequest(id);
    } finally {
      setDecliningId(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ---------- greeting ---------- */}
      <section className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold text-fg md:text-3xl">
          শুভ সকাল, {provider?.bnName?.split(" ")[0] ?? ""}
        </h1>
        <p className="text-base text-fg-secondary">
          {openRequests.length > 0 ? (
            <>
              আপনার জন্য{" "}
              <span className="font-semibold tabular text-fg">
                {formatCount(openRequests.length, "নতুন অনুরোধ")}
              </span>{" "}
              অপেক্ষা করছে।
            </>
          ) : (
            "এই মুহূর্তে নতুন কোনো অনুরোধ নেই।"
          )}
        </p>
      </section>

      {/* ---------- metrics ---------- */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {loadingProvider ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="নতুন অনুরোধ"
              value={formatCount(openRequests.length)}
              icon={<Inbox />}
              href="/provider/requests"
              tone="accent"
            />
            <StatCard
              label="পাঠানো কোটেশন"
              value={formatCount(sentQuotes.length)}
              icon={<BriefcaseBusiness />}
              href="/provider/quotes"
            />
            <StatCard
              label="আসন্ন কাজ"
              value={formatCount((upcoming ?? []).length)}
              icon={<BriefcaseBusiness />}
              href="/provider/jobs"
            />
            <StatCard
              label="এই মাসের আয়"
              value={formatBdt(earnings?.thisMonth ?? 0, { compact: true })}
              delta={18}
              icon={<Wallet />}
              href="/provider/earnings"
            />
            <StatCard
              label="গড় রেটিং"
              value={formatRating(provider?.rating ?? 0)}
              hint={formatCount(provider?.reviewCount ?? 0, "রিভিউ")}
              icon={<Star />}
              href="/provider/reviews"
            />
          </>
        )}
      </section>

      {/* ---------- new requests ---------- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2.5 text-lg font-semibold text-fg">
            নতুন অনুরোধ
            {openRequests.length > 0 && (
              <Badge tone="accent" size="sm" className="tabular">
                {formatCount(openRequests.length)}
              </Badge>
            )}
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/provider/requests">
              {ACTIONS.viewAll}
              <ArrowLeft aria-hidden="true" className="rotate-180" />
            </Link>
          </Button>
        </div>

        {loadingRequests ? (
          <ListSkeleton count={3} />
        ) : openRequests.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface">
            <EmptyState {...EMPTY.providerRequests} icon={<Inbox />} />
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {openRequests.slice(0, 4).map((request) => (
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
      </section>

      {/* ---------- today's jobs ---------- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-fg">আসন্ন কাজ</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/provider/jobs">{ACTIONS.viewAll}</Link>
          </Button>
        </div>

        {(upcoming ?? []).length === 0 ? (
          <div className="rounded-lg border border-border bg-surface">
            <EmptyState {...EMPTY.providerJobs} icon={<BriefcaseBusiness />} />
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {(upcoming ?? []).slice(0, 4).map((booking) => (
              <BookingCard key={booking._id} booking={booking} perspective="provider" />
            ))}
          </div>
        )}
      </section>

      {/* ---------- recent completions ---------- */}
      {(completed ?? []).length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-fg">
            <CircleCheck aria-hidden="true" className="size-5 text-success-600" />
            সাম্প্রতিক সম্পন্ন কাজ
          </h2>
          <ul className="flex flex-col divide-y divide-border-subtle rounded-lg border border-border bg-surface">
            {(completed ?? []).slice(0, 5).map((b) => (
              <li
                key={b._id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
              >
                <Link
                  href={`/provider/jobs/${b._id}`}
                  className="min-w-0 flex-1 truncate-bn text-sm font-medium text-fg underline-offset-4 hover:underline"
                >
                  {b.bnTitle}
                </Link>
                <span className="text-sm font-semibold tabular text-fg">
                  {formatBdt(b.amount - b.commission)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {composing && (
        <QuoteComposer
          request={composing}
          open={composing !== null}
          onOpenChange={(open) => !open && setComposing(null)}
        />
      )}
    </div>
  );
}

export { Rating };
