"use client";

import { useState } from "react";
import { Calendar, Hourglass, MapPin, ReceiptText, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { CategoryIcon } from "@/components/domain/category-icon";
import { QuoteCard } from "@/components/domain/quote-card";
import { ListSkeleton } from "@/components/skeletons";
import {
  useAreaById,
  useCategoryById,
  useLiveQuoteForRequest,
  useRequestById,
} from "@/lib/api/queries";
import { useMutations } from "@/lib/api/mutations";
import { formatBdt, formatDate } from "@/lib/format";
import { RelativeTime } from "@/components/ui/relative-time";
import { ACTIONS, EMPTY, SLOT_LABEL, URGENCY } from "@/lib/strings";

export function RequestDetailView({ requestId }: { requestId: string }) {
  const { data: request, isLoading, error, refetch } = useRequestById(requestId);
  const { data: category } = useCategoryById(request?.categoryId ?? null);
  const { data: area } = useAreaById(request?.areaId ?? null);
  const { data: quote } = useLiveQuoteForRequest(requestId);
  const { cancelRequest } = useMutations();
  const [pending, setPending] = useState(false);

  if (isLoading) return <ListSkeleton count={3} />;
  if (error || !request) return <ErrorState onRetry={refetch} />;

  const open = request.status === "open" || request.status === "quoted";

  async function cancel() {
    if (!request) return;
    setPending(true);
    try {
      await cancelRequest(request._id);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "ড্যাশবোর্ড", href: "/customer" },
          { label: "আমার অনুরোধ", href: "/customer/requests" },
          { label: request.bnTitle, href: `/customer/requests/${request._id}` },
        ]}
      />

      <section className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            {category && (
              <CategoryIcon icon={category.icon} tint={category.tint} size="lg" />
            )}
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="text-xl font-bold text-fg md:text-2xl">
                {request.bnTitle}
              </h1>
              <p className="text-sm text-fg-tertiary">
                {category?.bnShortName} · <RelativeTime value={request.createdAt} />
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <StatusBadge domain="request" status={request.status} size="lg" />
            {request.urgency !== "flexible" && (
              <Badge tone={URGENCY[request.urgency].tone} variant="outline" size="sm">
                {URGENCY[request.urgency].label}
              </Badge>
            )}
          </div>
        </div>

        <p className="text-base text-fg-secondary">{request.bnDescription}</p>

        <Separator />

        <dl className="grid gap-5 sm:grid-cols-3">
          <div className="flex gap-3">
            <Calendar aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-fg-tertiary" />
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-fg-tertiary">পছন্দের সময়</dt>
              <dd className="text-sm font-medium text-fg">
                {formatDate(request.preferredDate, "long")}
              </dd>
              <dd className="text-sm text-fg-secondary">
                {SLOT_LABEL[request.preferredSlot] ?? request.preferredSlot}
              </dd>
            </div>
          </div>

          <div className="flex gap-3">
            <MapPin aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-fg-tertiary" />
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-fg-tertiary">এলাকা</dt>
              <dd className="text-sm font-medium text-fg">{area?.bnName}</dd>
            </div>
          </div>

          <div className="flex gap-3">
            <Wallet aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-fg-tertiary" />
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-fg-tertiary">বাজেট</dt>
              <dd className="text-sm font-medium tabular text-fg">
                {request.budgetFrom || request.budgetTo
                  ? `${formatBdt(request.budgetFrom ?? 0)} – ${formatBdt(request.budgetTo ?? 0)}`
                  : "উল্লেখ করা হয়নি"}
              </dd>
            </div>
          </div>
        </dl>

        {open && (
          <div className="flex justify-end border-t border-border-subtle pt-4">
            <Button variant="ghost" loading={pending} onClick={cancel}>
              {ACTIONS.cancel}
            </Button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-fg">
          <ReceiptText aria-hidden="true" className="size-5 text-fg-tertiary" />
          কোটেশন
        </h2>

        {/* Only the team's current offer — replaced or declined ones are history. */}
        {quote ? (
          <QuoteCard quote={quote} />
        ) : request.status === "open" ? (
          <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-5">
            <Hourglass aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-teal-600" />
            <p className="text-sm text-fg-secondary">
              আমাদের টিম আপনার কাজের জন্য উপযুক্ত পেশাদার খুঁজছে। দাম ঠিক হলেই কোটেশন এখানে
              পাঠানো হবে — সাধারণত কয়েক ঘণ্টার মধ্যে।
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-surface">
            <EmptyState {...EMPTY.quotes} icon={<ReceiptText />} />
          </div>
        )}
      </section>
    </div>
  );
}
