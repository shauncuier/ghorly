"use client";

import Link from "next/link";
import { Calendar, MapPin, ReceiptText } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { CategoryIcon } from "@/components/domain/category-icon";
import { useAreaById, useCategoryById, useCustomerById } from "@/lib/api/queries";
import { formatCount, formatDate } from "@/lib/format";
import { RelativeTime } from "@/components/ui/relative-time";
import { ACTIONS, SLOT_LABEL, URGENCY } from "@/lib/strings";
import type { ServiceRequest } from "@/lib/types";

export function RequestCard({
  request,
  perspective,
  actions,
  className,
}: {
  request: ServiceRequest;
  perspective: "customer" | "provider";
  actions?: React.ReactNode;
  className?: string;
}) {
  const { data: category } = useCategoryById(request.categoryId);
  const { data: area } = useAreaById(request.areaId);
  const { data: customer } = useCustomerById(request.customerId);

  const href =
    perspective === "customer"
      ? `/customer/requests/${request._id}`
      : `/provider/requests/${request._id}`;

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
                {request.bnTitle}
              </Link>
            </h3>
            <p className="clamp-2 text-sm text-fg-secondary">{request.bnDescription}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge domain="request" status={request.status} />
          {request.urgency !== "flexible" && (
            <Badge
              tone={URGENCY[request.urgency].tone}
              variant="outline"
              size="sm"
            >
              {URGENCY[request.urgency].label}
            </Badge>
          )}
        </div>
      </div>

      <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-fg-secondary">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">পছন্দের সময়</dt>
          <Calendar aria-hidden="true" className="size-4 shrink-0 text-fg-tertiary" />
          <dd>
            {formatDate(request.preferredDate, "medium")} ·{" "}
            {SLOT_LABEL[request.preferredSlot] ?? request.preferredSlot}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">এলাকা</dt>
          <MapPin aria-hidden="true" className="size-4 shrink-0 text-fg-tertiary" />
          <dd>{area?.bnName}</dd>
        </div>
        {perspective === "provider" && customer && (
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">গ্রাহক</dt>
            <dd>গ্রাহক: {customer.bnName}</dd>
          </div>
        )}
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-4">
        <span className="flex items-center gap-4 text-xs text-fg-tertiary">
          <span className="flex items-center gap-1.5">
            <ReceiptText aria-hidden="true" className="size-3.5" />
            <span className="tabular">
              {formatCount(request.quoteIds.length, "কোটেশন")}
            </span>
          </span>
          <span className="tabular"><RelativeTime value={request.createdAt} /></span>
        </span>

        {actions ?? (
          <Button asChild variant="secondary" size="sm">
            <Link href={href}>
              {perspective === "provider" ? ACTIONS.viewRequest : ACTIONS.viewDetails}
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}
