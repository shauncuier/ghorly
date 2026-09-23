"use client";

import Link from "next/link";
import {
  BriefcaseBusiness,
  FileText,
  HardHat,
  Percent,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PriceDisplay } from "@/components/ui/price-display";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/app-shell/app-shell";
import { StatCard } from "@/components/app-shell/stat-card";
import { AreaChart, BarChart, DonutChart, LineChart } from "@/components/charts";
import { StatCardSkeleton } from "@/components/skeletons";
import {
  useAllBookings,
  useAllProviders,
  useAllRequests,
  useCustomerById,
  useCustomers,
  useProviderById,
  useVerifications,
} from "@/lib/api/queries";
import { ADMIN_METRICS } from "@/lib/data/admin-metrics";
import { formatBdt, formatCount, formatDate } from "@/lib/format";
import { ACTIONS, EMPTY } from "@/lib/strings";

/**
 * Platform overview.
 *
 * Headline figures come from `ADMIN_METRICS`, which computes them from the
 * same seed data the tables below read — so the dashboard can never
 * contradict the lists it sits above.
 */
export function AdminDashboardView() {
  const { data: customers, isLoading } = useCustomers();
  const { data: providers } = useAllProviders();
  const { data: requests } = useAllRequests();
  const { data: bookings } = useAllBookings();
  const { data: verifications } = useVerifications();

  const m = ADMIN_METRICS;
  const activeRequests = (requests ?? []).filter(
    (r) => r.status === "open" || r.status === "quoted",
  );
  const completed = (bookings ?? []).filter((b) => b.status === "completed");
  const pendingVerifications = (verifications ?? []).filter((v) => v.status === "pending");
  const recentBookings = (bookings ?? []).slice(0, 6);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="প্ল্যাটফর্ম ওভারভিউ"
        description="ঘরলির সামগ্রিক অবস্থা এক নজরে।"
        className="mb-0"
      />

      {/* ---------- six metrics ---------- */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="মোট গ্রাহক"
              value={formatCount((customers ?? []).length)}
              delta={m.deltas.customers}
              icon={<Users />}
              href="/admin/customers"
            />
            <StatCard
              label="মোট পেশাদার"
              value={formatCount((providers ?? []).length)}
              delta={m.deltas.providers}
              icon={<HardHat />}
              href="/admin/professionals"
            />
            <StatCard
              label="চলমান অনুরোধ"
              value={formatCount(activeRequests.length)}
              delta={m.deltas.requests}
              icon={<FileText />}
              href="/admin/requests"
              tone="accent"
            />
            <StatCard
              label="সম্পন্ন কাজ"
              value={formatCount(completed.length)}
              delta={m.deltas.jobs}
              icon={<BriefcaseBusiness />}
              href="/admin/bookings"
            />
            <StatCard
              label="মোট আয়"
              value={formatBdt(m.revenue, { compact: true })}
              delta={m.deltas.revenue}
              icon={<Wallet />}
              href="/admin/payments"
            />
            <StatCard
              label="প্ল্যাটফর্ম কমিশন"
              value={formatBdt(m.commission, { compact: true })}
              delta={m.deltas.commission}
              icon={<Percent />}
              href="/admin/reports"
            />
          </>
        )}
      </section>

      {/* ---------- charts ---------- */}
      <section className="grid gap-4 xl:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-fg">মাসিক আয়</h2>
          <AreaChart data={m.revenueByMonth} label="গত ১২ মাসের আয়" />
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-fg">মাসিক বুকিং</h2>
          <BarChart data={m.bookingsByMonth} label="গত ১২ মাসের বুকিং" />
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-fg">ব্যবহারকারী বৃদ্ধি</h2>
          <LineChart
            data={m.userGrowthByWeek}
            label="সাপ্তাহিক ব্যবহারকারী বৃদ্ধি"
            seriesLabels={["গ্রাহক", "পেশাদার"]}
          />
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-fg">সেবা অনুযায়ী কাজ</h2>
          <DonutChart data={m.bookingsByCategory} label="সেবার ধরন অনুযায়ী কাজের সংখ্যা" />
        </div>
      </section>

      {/* ---------- operational lists ---------- */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-fg">সাম্প্রতিক বুকিং</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/bookings">{ACTIONS.viewAll}</Link>
            </Button>
          </div>

          <ul className="flex flex-col divide-y divide-border-subtle rounded-lg border border-border bg-surface">
            {recentBookings.map((b) => (
              <li
                key={b._id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate-bn text-sm font-medium text-fg">
                    {b.bnTitle}
                  </span>
                  <span className="text-xs tabular text-fg-tertiary">
                    {formatDate(b.scheduledDate, "medium")}
                  </span>
                </span>
                <StatusBadge domain="booking" status={b.status} size="sm" />
                <PriceDisplay amount={b.amount} size="sm" />
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="flex items-center gap-2.5 text-lg font-semibold text-fg">
              যাচাইয়ের অপেক্ষায়
              {pendingVerifications.length > 0 && (
                <Badge tone="warning" size="sm" className="tabular">
                  {formatCount(pendingVerifications.length)}
                </Badge>
              )}
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/verification">{ACTIONS.viewAll}</Link>
            </Button>
          </div>

          {pendingVerifications.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface">
              <EmptyState {...EMPTY.verifications} size="sm" />
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-border-subtle rounded-lg border border-border bg-surface">
              {pendingVerifications.slice(0, 6).map((v) => (
                <li key={v._id}>
                  <PendingVerificationRow providerId={v.providerId} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function PendingVerificationRow({ providerId }: { providerId: string }) {
  const { data: provider } = useProviderById(providerId);
  if (!provider) return null;

  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <Avatar id={provider._id} name={provider.bnName} size="sm" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate-bn text-sm font-medium text-fg">{provider.bnName}</span>
        <span className="truncate-bn text-xs text-fg-tertiary">{provider.bnTitle}</span>
      </span>
      <Button asChild variant="secondary" size="sm">
        <Link href="/admin/verification">দেখুন</Link>
      </Button>
    </div>
  );
}

export { useCustomerById };
