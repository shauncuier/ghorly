"use client";

import Link from "next/link";
import {
  BriefcaseBusiness,
  CircleCheck,
  Star,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Rating } from "@/components/ui/rating";
import { StatCard } from "@/components/app-shell/stat-card";
import { BookingCard } from "@/components/domain/booking-card";
import { StatCardSkeleton } from "@/components/skeletons";
import {
  useCurrentProvider,
  useProviderBookings,
  useProviderEarnings,
} from "@/lib/api/queries";
import { formatBdt, formatCount, formatRating } from "@/lib/format";
import { ACTIONS, EMPTY } from "@/lib/strings";

/**
 * The provider's home.
 *
 * Providers don't hunt for work — the Ghorly team assigns jobs to them — so
 * the first question is "what am I doing next", and upcoming jobs lead.
 */
export function ProviderDashboardView() {
  const { data: provider, isLoading: loadingProvider } = useCurrentProvider();
  const { data: upcoming } = useProviderBookings(["upcoming", "active"]);
  const { data: completed } = useProviderBookings(["completed"]);
  const { data: earnings } = useProviderEarnings();
  const nextJobs = upcoming ?? [];

  return (
    <div className="flex flex-col gap-8">
      {/* ---------- greeting ---------- */}
      <section className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold text-fg md:text-3xl">
          শুভ সকাল, {provider?.bnName?.split(" ")[0] ?? ""}
        </h1>
        <p className="text-base text-fg-secondary">
          {nextJobs.length > 0 ? (
            <>
              আপনার{" "}
              <span className="font-semibold tabular text-fg">
                {formatCount(nextJobs.length, "টি কাজ")}
              </span>{" "}
              সামনে আছে।
            </>
          ) : (
            "এই মুহূর্তে কোনো কাজ নেই। নতুন কাজ দিলে ঘরলি টিম আপনাকে জানাবে।"
          )}
        </p>
      </section>

      {/* ---------- metrics ---------- */}
      <section className="grid gap-4 sm:grid-cols-3">
        {loadingProvider ? (
          Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
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

    </div>
  );
}

export { Rating };
