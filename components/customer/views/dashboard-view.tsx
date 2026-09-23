"use client";

import Link from "next/link";
import { ArrowLeft, CalendarCheck, FileText, Heart, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { StatCard } from "@/components/app-shell/stat-card";
import { BookingCard } from "@/components/domain/booking-card";
import { RequestCard } from "@/components/domain/request-card";
import { ServiceChipCard } from "@/components/domain/service-card";
import { ProviderCardCompact } from "@/components/domain/provider-card";
import {
  BookingCardSkeleton,
  ListSkeleton,
  StatCardSkeleton,
} from "@/components/skeletons";
import {
  useCategories,
  useCurrentCustomer,
  useCustomerBookings,
  useCustomerQuotes,
  useCustomerRequests,
  useFavorites,
  useProviders,
} from "@/lib/api/queries";
import { formatCount } from "@/lib/format";
import { ACTIONS, EMPTY } from "@/lib/strings";
import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * The customer's home.
 *
 * Answers the three questions the brief sets out, top to bottom: what do I
 * need (search + popular services), what's happening (active requests,
 * upcoming booking), and who could do it (recommended providers).
 */
export function DashboardView() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const { data: customer, isLoading: loadingCustomer } = useCurrentCustomer();
  const { data: categories } = useCategories();
  const { data: requests, isLoading: loadingRequests } = useCustomerRequests();
  const { data: quotes } = useCustomerQuotes();
  const { data: upcoming, isLoading: loadingBookings } = useCustomerBookings([
    "upcoming",
    "active",
  ]);
  const { data: favorites } = useFavorites();
  const { data: recommended, isLoading: loadingProviders } = useProviders({
    areaId: customer?.areaId,
    sort: "rating",
  });

  const activeRequests = (requests ?? []).filter(
    (r) => r.status === "open" || r.status === "quoted",
  );
  const openQuotes = (quotes ?? []).filter((q) => q.status === "sent");
  const popular = (categories ?? []).filter((c) => c.isPopular).slice(0, 8);

  function search(e: React.FormEvent) {
    e.preventDefault();
    router.push(
      `/customer/services${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`,
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ---------- greeting + search ---------- */}
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold text-fg md:text-3xl">
            শুভ সকাল, {customer?.bnName?.split(" ")[0] ?? ""}
          </h1>
          <p className="text-base text-fg-secondary">
            আজ আপনার ঘরের জন্য কী করতে পারি?
          </p>
        </div>

        <form onSubmit={search} className="flex flex-col gap-2.5 sm:flex-row">
          <SearchInput
            value={query}
            onValueChange={setQuery}
            size="lg"
            placeholder="যে সেবা খুঁজছেন লিখুন…"
            className="flex-1"
          />
          <Button type="submit" size="lg" className="sm:px-8">
            {ACTIONS.findService}
          </Button>
        </form>
      </section>

      {/* ---------- at a glance ---------- */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loadingCustomer ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="চলমান অনুরোধ"
              value={formatCount(activeRequests.length)}
              icon={<FileText />}
              href="/customer/requests"
              tone="accent"
            />
            <StatCard
              label="নতুন কোটেশন"
              value={formatCount(openQuotes.length)}
              icon={<ReceiptText />}
              href="/customer/quotes"
              hint={openQuotes.length > 0 ? "সিদ্ধান্তের অপেক্ষায়" : undefined}
            />
            <StatCard
              label="আসন্ন বুকিং"
              value={formatCount((upcoming ?? []).length)}
              icon={<CalendarCheck />}
              href="/customer/bookings"
            />
            <StatCard
              label="পছন্দের তালিকা"
              value={formatCount((favorites ?? []).length)}
              icon={<Heart />}
              href="/customer/favorites"
            />
          </>
        )}
      </section>

      {/* ---------- popular services ---------- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-fg">জনপ্রিয় সেবা</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/customer/services">
              {ACTIONS.viewAll}
              <ArrowLeft aria-hidden="true" className="rotate-180" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {popular.map((category) => (
            <ServiceChipCard key={category._id} category={category} />
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* ---------- active requests ---------- */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-fg">চলমান অনুরোধ</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/customer/requests">{ACTIONS.viewAll}</Link>
            </Button>
          </div>

          {loadingRequests ? (
            <ListSkeleton count={2} />
          ) : activeRequests.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface">
              <EmptyState {...EMPTY.requests} size="sm" icon={<FileText />} />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeRequests.slice(0, 3).map((request) => (
                <RequestCard key={request._id} request={request} perspective="customer" />
              ))}
            </div>
          )}
        </section>

        {/* ---------- upcoming booking ---------- */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-fg">আসন্ন বুকিং</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/customer/bookings">{ACTIONS.viewAll}</Link>
            </Button>
          </div>

          {loadingBookings ? (
            <BookingCardSkeleton />
          ) : (upcoming ?? []).length === 0 ? (
            <div className="rounded-lg border border-border bg-surface">
              <EmptyState
                {...EMPTY.upcomingBookings}
                size="sm"
                icon={<CalendarCheck />}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {(upcoming ?? []).slice(0, 2).map((booking) => (
                <BookingCard key={booking._id} booking={booking} perspective="customer" />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ---------- recommended ---------- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-fg">আপনার এলাকার পেশাদার</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/customer/services">
              {ACTIONS.viewAll}
              <ArrowLeft aria-hidden="true" className="rotate-180" />
            </Link>
          </Button>
        </div>

        {loadingProviders ? (
          <ListSkeleton count={4} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {(recommended ?? []).slice(0, 6).map((provider) => (
              <ProviderCardCompact key={provider._id} provider={provider} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
