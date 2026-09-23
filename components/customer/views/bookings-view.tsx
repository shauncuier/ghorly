"use client";

import { CalendarCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/app-shell/app-shell";
import { BookingCard } from "@/components/domain/booking-card";
import { BookingCardSkeleton } from "@/components/skeletons";
import { useCustomerBookings } from "@/lib/api/queries";
import { formatCount } from "@/lib/format";
import { EMPTY } from "@/lib/strings";
import type { BookingStatus } from "@/lib/types";

const TABS: { value: string; label: string; match: BookingStatus[] }[] = [
  { value: "upcoming", label: "আসন্ন", match: ["upcoming", "active"] },
  { value: "completed", label: "সম্পন্ন", match: ["completed"] },
  { value: "cancelled", label: "বাতিল", match: ["cancelled"] },
];

export function BookingsView() {
  const { data: bookings, isLoading, error, refetch } = useCustomerBookings();
  const all = bookings ?? [];

  return (
    <>
      <PageHeader title="আমার বুকিং" description="আপনার বুক করা সব সেবা।" />

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex flex-col gap-4">
          <BookingCardSkeleton />
          <BookingCardSkeleton />
        </div>
      ) : (
        <Tabs defaultValue="upcoming">
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
                    <EmptyState {...EMPTY.bookings} icon={<CalendarCheck />} />
                  </div>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {rows.map((booking) => (
                      <BookingCard
                        key={booking._id}
                        booking={booking}
                        perspective="customer"
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
