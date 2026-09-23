"use client";

import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriceDisplay } from "@/components/ui/price-display";
import { CategoryIcon } from "@/components/domain/category-icon";
import {
  useAreaById,
  useCategoryById,
  useCustomerById,
  useProviderById,
} from "@/lib/api/queries";
import { formatDate, isToday } from "@/lib/format";
import { ACTIONS, COMMON, SLOT_LABEL } from "@/lib/strings";
import type { Booking } from "@/lib/types";

/**
 * Shared by the customer's bookings list and the provider's job list — the
 * `perspective` prop just swaps whose name and which detail link is shown.
 */
export function BookingCard({
  booking,
  perspective,
  actions,
  className,
}: {
  booking: Booking;
  perspective: "customer" | "provider";
  actions?: React.ReactNode;
  className?: string;
}) {
  const { data: category } = useCategoryById(booking.categoryId);
  const { data: area } = useAreaById(booking.areaId);
  const { data: provider } = useProviderById(booking.providerId);
  const { data: customer } = useCustomerById(booking.customerId);

  const counterpart =
    perspective === "customer"
      ? { id: provider?._id ?? "", name: provider?.bnName ?? "", role: "পেশাদার" }
      : { id: customer?._id ?? "", name: customer?.bnName ?? "", role: "গ্রাহক" };

  const href =
    perspective === "customer"
      ? `/customer/bookings/${booking._id}`
      : `/provider/jobs/${booking._id}`;

  const today = isToday(booking.scheduledDate);

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-border bg-surface p-5",
        "transition-[border-color,box-shadow] duration-(--duration-fast) hover:border-border-strong hover:shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3.5">
          {category && (
            <CategoryIcon icon={category.icon} tint={category.tint} size="md" />
          )}
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="text-base font-semibold text-fg">
              <Link
                href={href}
                className="rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              >
                {booking.bnTitle}
              </Link>
            </h3>
            <p className="truncate-bn text-sm text-fg-tertiary">
              {category?.bnShortName}
            </p>
          </div>
        </div>
        <StatusBadge domain="booking" status={booking.status} />
      </div>

      <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-fg-secondary">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">তারিখ</dt>
          <Calendar aria-hidden="true" className="size-4 shrink-0 text-fg-tertiary" />
          <dd>
            {today ? (
              <span className="font-medium text-teal-700">{COMMON.today}</span>
            ) : (
              formatDate(booking.scheduledDate, "medium")
            )}
            {" · "}
            {SLOT_LABEL[booking.scheduledSlot] ?? booking.scheduledSlot}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">এলাকা</dt>
          <MapPin aria-hidden="true" className="size-4 shrink-0 text-fg-tertiary" />
          <dd>{area?.bnName}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-4">
        <div className="flex items-center gap-2.5">
          <Avatar id={counterpart.id} name={counterpart.name} size="xs" />
          <span className="flex flex-col">
            <span className="text-xs text-fg-tertiary">{counterpart.role}</span>
            <span className="text-sm font-medium text-fg">{counterpart.name}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <PriceDisplay amount={booking.amount} size="md" />
          {actions ?? (
            <Button asChild variant="secondary" size="sm">
              <Link href={href}>{ACTIONS.viewDetails}</Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
