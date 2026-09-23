"use client";

import { useState } from "react";
import Link from "next/link";
import { EyeOff, MapPin, RotateCcw, Scale, Undo2, Wrench } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PriceDisplay } from "@/components/ui/price-display";
import { DataTable, type Column } from "@/components/ui/data-table";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { PageHeader } from "@/components/app-shell/app-shell";
import { StatCard } from "@/components/app-shell/stat-card";
import { CategoryIcon } from "@/components/domain/category-icon";
import { QuotationModal } from "@/components/admin/quotation-modal";
import { AreaChart, BarChart, DonutChart } from "@/components/charts";
import {
  useAllBookings,
  useAllPayments,
  useAllProviders,
  useAllRequests,
  useAllReviews,
  useAreas,
  useCategories,
  useCustomerById,
  useCustomers,
  useDisputes,
  useLiveQuoteForRequest,
  useProviderById,
} from "@/lib/api/queries";
import { useMutations } from "@/lib/api/mutations";
import { ADMIN_METRICS } from "@/lib/data/admin-metrics";
import { formatBdt, formatCount, formatDate, formatPercent } from "@/lib/format";
import { ACTIONS, EMPTY, PAYMENT_METHOD_BN } from "@/lib/strings";
import type { Booking, Dispute, Payment, Review, ServiceRequest } from "@/lib/types";

/* ==========================================================================
   Requests
   ========================================================================== */

export function AdminRequestsView() {
  const { data: requests, isLoading } = useAllRequests();
  const [quoting, setQuoting] = useState<ServiceRequest | null>(null);
  const all = requests ?? [];
  const waiting = all.filter((r) => r.status === "open").length;

  // Waiting-for-quote first, oldest first: the dispatch queue.
  const rows = [...all].sort((x, y) => {
    const rank = (r: ServiceRequest) => (r.status === "open" ? 0 : r.status === "quoted" ? 1 : 2);
    return rank(x) - rank(y) || x.createdAt.localeCompare(y.createdAt);
  });

  const columns: Column<ServiceRequest>[] = [
    {
      key: "title",
      header: "অনুরোধ",
      cell: (r) => (
        <span className="flex flex-col">
          <span className="text-sm font-medium text-fg">{r.bnTitle}</span>
          <span className="text-xs tabular text-fg-tertiary">{r._id}</span>
        </span>
      ),
      sortBy: (r) => r.bnTitle,
    },
    {
      key: "customer",
      header: "গ্রাহক",
      cell: (r) => <CustomerName id={r.customerId} />,
      hideBelow: "md",
    },
    {
      key: "date",
      header: "পছন্দের দিন",
      cell: (r) => formatDate(r.preferredDate, "medium"),
      sortBy: (r) => r.preferredDate,
      hideBelow: "lg",
    },
    {
      key: "quote",
      header: "কোটেশন",
      cell: (r) => <LiveQuote request={r} />,
      hideBelow: "md",
    },
    {
      key: "status",
      header: "অবস্থা",
      cell: (r) => <StatusBadge domain="request" status={r.status} size="sm" />,
    },
    {
      key: "action",
      header: "",
      align: "end",
      cell: (r) => <QuoteAction request={r} onQuote={() => setQuoting(r)} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="অনুরোধ"
        description="গ্রাহকের অনুরোধ দেখে পেশাদারের সাথে দাম ঠিক করুন, তারপর কোটেশন পাঠান।"
        action={
          waiting > 0 && (
            <Badge tone="warning" size="lg" className="tabular">
              {formatCount(waiting, "অপেক্ষমান")}
            </Badge>
          )
        }
      />
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(r) => r._id}
        isLoading={isLoading}
        caption="সব সেবার অনুরোধ"
        empty={<EmptyState {...EMPTY.requests} />}
        renderMobileCard={(r) => (
          <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="min-w-0 text-sm font-medium text-fg">{r.bnTitle}</span>
              <StatusBadge domain="request" status={r.status} size="sm" />
            </div>
            <span className="text-xs tabular text-fg-tertiary">
              <CustomerName id={r.customerId} /> · {formatDate(r.preferredDate, "medium")}
            </span>
            <LiveQuote request={r} />
            <QuoteAction request={r} onQuote={() => setQuoting(r)} />
          </div>
        )}
      />
      <QuotationModal request={quoting} onClose={() => setQuoting(null)} />
    </>
  );
}

/** Who the live (or accepted) quotation names, and for how much. */
function LiveQuote({ request }: { request: ServiceRequest }) {
  const { data: quote } = useLiveQuoteForRequest(request._id);
  if (!quote) return <span className="text-sm text-fg-disabled">—</span>;
  return (
    <span className="flex flex-col">
      <ProviderName id={quote.providerId} />
      <span className="text-xs tabular text-fg-tertiary">
        {formatBdt(quote.amount)} · পাওনা {formatBdt(quote.providerPayout ?? 0)}
      </span>
    </span>
  );
}

function QuoteAction({ request, onQuote }: { request: ServiceRequest; onQuote: () => void }) {
  if (request.status !== "open" && request.status !== "quoted") return null;
  return (
    <Button size="sm" variant={request.status === "open" ? "primary" : "secondary"} onClick={onQuote}>
      {request.status === "open" ? "কোটেশন পাঠান" : "নতুন কোটেশন"}
    </Button>
  );
}

function CustomerName({ id }: { id: string }) {
  const { data } = useCustomerById(id);
  return <span className="text-sm text-fg-secondary">{data?.bnName ?? "—"}</span>;
}

function ProviderName({ id }: { id: string }) {
  const { data } = useProviderById(id);
  return <span className="text-sm text-fg-secondary">{data?.bnName ?? "—"}</span>;
}

/* ==========================================================================
   Bookings
   ========================================================================== */

export function AdminBookingsView() {
  const { data: bookings, isLoading } = useAllBookings();

  const columns: Column<Booking>[] = [
    {
      key: "title",
      header: "কাজ",
      cell: (b) => (
        <span className="flex flex-col">
          <span className="text-sm font-medium text-fg">{b.bnTitle}</span>
          <span className="font-latin text-xs text-fg-tertiary" lang="en">
            {b._id}
          </span>
        </span>
      ),
      sortBy: (b) => b.bnTitle,
    },
    {
      key: "customer",
      header: "গ্রাহক",
      cell: (b) => <CustomerName id={b.customerId} />,
      hideBelow: "lg",
    },
    {
      key: "provider",
      header: "পেশাদার",
      cell: (b) => <ProviderName id={b.providerId} />,
      hideBelow: "md",
    },
    {
      key: "date",
      header: "তারিখ",
      cell: (b) => formatDate(b.scheduledDate, "medium"),
      sortBy: (b) => b.scheduledDate,
      hideBelow: "md",
    },
    {
      key: "status",
      header: "অবস্থা",
      cell: (b) => <StatusBadge domain="booking" status={b.status} size="sm" />,
    },
    {
      key: "amount",
      header: "পরিমাণ",
      align: "end",
      cell: (b) => <PriceDisplay amount={b.amount} size="sm" />,
      sortBy: (b) => b.amount,
    },
  ];

  return (
    <>
      <PageHeader
        title="বুকিং"
        description={`মোট ${formatCount((bookings ?? []).length, "বুকিং")}।`}
      />
      <DataTable
        data={bookings ?? []}
        columns={columns}
        getRowId={(b) => b._id}
        isLoading={isLoading}
        caption="সব বুকিং"
        empty={<EmptyState {...EMPTY.bookings} />}
        renderMobileCard={(b) => (
          <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="min-w-0 text-sm font-medium text-fg">{b.bnTitle}</span>
              <StatusBadge domain="booking" status={b.status} size="sm" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs tabular text-fg-tertiary">
                {formatDate(b.scheduledDate, "medium")}
              </span>
              <PriceDisplay amount={b.amount} size="sm" />
            </div>
          </div>
        )}
      />
    </>
  );
}

/* ==========================================================================
   Payments
   ========================================================================== */

export function AdminPaymentsView() {
  const { data: payments, isLoading } = useAllPayments();
  const { refundPayment } = useMutations();
  const [refunding, setRefunding] = useState<string | null>(null);

  const paid = (payments ?? []).filter((p) => p.status === "paid");
  const revenue = paid.reduce((s, p) => s + p.amount, 0);
  const commission = paid.reduce((s, p) => s + p.commission, 0);

  const columns: Column<Payment>[] = [
    {
      key: "id",
      header: "লেনদেন",
      cell: (p) => (
        <span className="font-latin text-sm text-fg" lang="en">
          {p._id}
        </span>
      ),
    },
    {
      key: "customer",
      header: "গ্রাহক",
      cell: (p) => <CustomerName id={p.customerId} />,
      hideBelow: "lg",
    },
    {
      key: "method",
      header: "মাধ্যম",
      cell: (p) => PAYMENT_METHOD_BN[p.method],
      hideBelow: "md",
    },
    {
      key: "commission",
      header: "কমিশন",
      align: "end",
      cell: (p) => <span className="tabular">{formatBdt(p.commission)}</span>,
      sortBy: (p) => p.commission,
      hideBelow: "md",
    },
    {
      key: "status",
      header: "অবস্থা",
      cell: (p) => <StatusBadge domain="payment" status={p.status} size="sm" />,
    },
    {
      key: "amount",
      header: "পরিমাণ",
      align: "end",
      cell: (p) => <PriceDisplay amount={p.amount} size="sm" />,
      sortBy: (p) => p.amount,
    },
    {
      key: "actions",
      header: "",
      align: "end",
      cell: (p) =>
        p.status === "paid" ? (
          <Button
            variant="ghost"
            size="sm"
            loading={refunding === p._id}
            onClick={async () => {
              setRefunding(p._id);
              try {
                await refundPayment(p._id);
              } finally {
                setRefunding(null);
              }
            }}
          >
            <Undo2 aria-hidden="true" />
            {ACTIONS.refund}
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader title="পেমেন্ট" description="প্ল্যাটফর্মের সব লেনদেন।" />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="মোট আয়" value={formatBdt(revenue, { compact: true })} tone="accent" />
        <StatCard label="কমিশন" value={formatBdt(commission, { compact: true })} />
        <StatCard label="পরিশোধিত লেনদেন" value={formatCount(paid.length)} />
      </div>

      <DataTable
        data={payments ?? []}
        columns={columns}
        getRowId={(p) => p._id}
        isLoading={isLoading}
        caption="সব পেমেন্ট"
        empty={<EmptyState {...EMPTY.payments} />}
        renderMobileCard={(p) => (
          <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="font-latin text-xs text-fg-tertiary" lang="en">
                {p._id}
              </span>
              <StatusBadge domain="payment" status={p.status} size="sm" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-fg-tertiary">
                {PAYMENT_METHOD_BN[p.method]}
              </span>
              <PriceDisplay amount={p.amount} size="sm" />
            </div>
          </div>
        )}
      />
    </>
  );
}

/* ==========================================================================
   Reviews moderation
   ========================================================================== */

export function AdminReviewsView() {
  const { data: reviews, isLoading } = useAllReviews();
  const { hideReview, restoreReview } = useMutations();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const columns: Column<Review>[] = [
    {
      key: "body",
      header: "রিভিউ",
      cell: (r) => (
        <span className="flex flex-col gap-0.5">
          <span className="clamp-2 max-w-md text-sm text-fg">{r.bnBody}</span>
          <span className="text-xs tabular text-fg-tertiary">
            {formatDate(r.createdAt, "medium")}
          </span>
        </span>
      ),
    },
    {
      key: "provider",
      header: "পেশাদার",
      cell: (r) => <ProviderName id={r.providerId} />,
      hideBelow: "md",
    },
    {
      key: "rating",
      header: "রেটিং",
      cell: (r) => <Rating value={r.rating} size="sm" compact />,
      sortBy: (r) => r.rating,
    },
    {
      key: "state",
      header: "অবস্থা",
      cell: (r) => (
        <Badge tone={r.isHidden ? "neutral" : "success"} size="sm">
          {r.isHidden ? "লুকানো" : "প্রকাশিত"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "end",
      cell: (r) => (
        <Button
          variant="ghost"
          size="sm"
          loading={pendingId === r._id}
          onClick={async () => {
            setPendingId(r._id);
            try {
              if (r.isHidden) await restoreReview(r._id);
              else await hideReview(r._id);
            } finally {
              setPendingId(null);
            }
          }}
        >
          {r.isHidden ? (
            <>
              <RotateCcw aria-hidden="true" />
              ফিরিয়ে আনুন
            </>
          ) : (
            <>
              <EyeOff aria-hidden="true" />
              লুকান
            </>
          )}
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="রিভিউ"
        description="অনুপযুক্ত রিভিউ লুকিয়ে রাখতে পারেন।"
      />
      <DataTable
        data={reviews ?? []}
        columns={columns}
        getRowId={(r) => r._id}
        isLoading={isLoading}
        caption="সব রিভিউ"
        empty={<EmptyState {...EMPTY.reviews} />}
        renderMobileCard={(r) => (
          <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <Rating value={r.rating} size="sm" compact />
              <Badge tone={r.isHidden ? "neutral" : "success"} size="sm">
                {r.isHidden ? "লুকানো" : "প্রকাশিত"}
              </Badge>
            </div>
            <p className="clamp-3 text-sm text-fg-secondary">{r.bnBody}</p>
          </div>
        )}
      />
    </>
  );
}

/* ==========================================================================
   Disputes
   ========================================================================== */

export function AdminDisputesView() {
  const { data: disputes, isLoading } = useDisputes();
  const { resolveDispute } = useMutations();
  const [resolving, setResolving] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState("");
  const [pending, setPending] = useState(false);

  const open = (disputes ?? []).filter((d) => d.status !== "resolved" && d.status !== "rejected");
  const closed = (disputes ?? []).filter((d) => d.status === "resolved" || d.status === "rejected");

  async function resolve() {
    if (!resolving) return;
    setPending(true);
    try {
      await resolveDispute(resolving._id, resolution || "নিষ্পত্তি হয়েছে।");
      setResolving(null);
      setResolution("");
    } finally {
      setPending(false);
    }
  }

  if (isLoading) return null;

  return (
    <>
      <PageHeader
        title="বিরোধ"
        description="গ্রাহক ও পেশাদারদের অভিযোগ নিষ্পত্তি করুন।"
        action={
          open.length > 0 && (
            <Badge tone="warning" size="lg" className="tabular">
              {formatCount(open.length, "খোলা")}
            </Badge>
          )
        }
      />

      {open.length === 0 ? (
        <div className="mb-8 rounded-lg border border-border bg-surface">
          <EmptyState {...EMPTY.disputes} icon={<Scale />} />
        </div>
      ) : (
        <ul className="mb-10 flex flex-col gap-4">
          {open.map((d) => (
            <li key={d._id}>
              <DisputeCard dispute={d} onResolve={() => setResolving(d)} />
            </li>
          ))}
        </ul>
      )}

      {closed.length > 0 && (
        <>
          <h2 className="mb-4 text-lg font-semibold text-fg">নিষ্পত্তি হওয়া</h2>
          <ul className="flex flex-col gap-3">
            {closed.map((d) => (
              <li key={d._id}>
                <DisputeCard dispute={d} />
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal open={resolving !== null} onOpenChange={(o) => !o && setResolving(null)}>
        <ModalContent size="sm">
          <ModalHeader>
            <ModalTitle>বিরোধ নিষ্পত্তি</ModalTitle>
            <ModalDescription>{resolving?.bnReason}</ModalDescription>
          </ModalHeader>
          <ModalBody>
            <Textarea
              rows={4}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="কী সিদ্ধান্ত নেওয়া হলো, লিখুন…"
              aria-label="নিষ্পত্তির বিবরণ"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setResolving(null)}>
              {ACTIONS.cancel}
            </Button>
            <Button loading={pending} onClick={resolve}>
              {ACTIONS.resolve}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

function DisputeCard({
  dispute,
  onResolve,
}: {
  dispute: Dispute;
  onResolve?: () => void;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-base font-semibold text-fg">{dispute.bnReason}</h3>
          <p className="text-xs tabular text-fg-tertiary">
            {dispute.raisedByRole === "customer" ? "গ্রাহক" : "পেশাদার"} ·{" "}
            {formatDate(dispute.createdAt, "medium")} ·{" "}
            <span className="font-latin" lang="en">
              {dispute.bookingId}
            </span>
          </p>
        </div>
        <StatusBadge domain="dispute" status={dispute.status} />
      </div>

      <p className="rounded-md bg-surface-muted px-4 py-3 text-sm text-fg-secondary">
        {dispute.bnDetail}
      </p>

      {dispute.bnResolution && (
        <p className="rounded-md border-s-2 border-success-500 bg-success-50 px-4 py-3 text-sm text-success-700">
          {dispute.bnResolution}
        </p>
      )}

      {onResolve && (
        <div className="flex justify-end border-t border-border-subtle pt-3">
          <Button size="sm" onClick={onResolve}>
            {ACTIONS.resolve}
          </Button>
        </div>
      )}
    </article>
  );
}

/* ==========================================================================
   Services & locations
   ========================================================================== */

export function AdminServicesView() {
  const { data: categories, isLoading } = useCategories();
  const { toggleCategoryActive } = useMutations();

  if (isLoading) return null;

  return (
    <>
      <PageHeader
        title="সেবা"
        description="কোন সেবাগুলো প্ল্যাটফর্মে চালু থাকবে।"
      />
      <ul className="grid gap-3 md:grid-cols-2">
        {(categories ?? []).map((c) => (
          <li
            key={c._id}
            className="flex items-center gap-4 rounded-lg border border-border bg-surface p-5"
          >
            <CategoryIcon icon={c.icon} tint={c.tint} size="md" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-base font-semibold text-fg">{c.bnShortName}</span>
              <span className="text-xs tabular text-fg-tertiary">
                {formatCount(c.providerCount, "পেশাদার")} ·{" "}
                {formatCount(c.jobCount, "কাজ")} · {formatBdt(c.priceFrom)}+
              </span>
            </div>
            <Switch
              checked={c.isActive}
              aria-label={`${c.bnShortName} চালু রাখবেন কিনা`}
              onCheckedChange={() => void toggleCategoryActive(c._id)}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

export function AdminLocationsView() {
  const { data: areas, isLoading } = useAreas();
  const { toggleAreaActive } = useMutations();

  if (isLoading) return null;

  return (
    <>
      <PageHeader title="এলাকা" description="কোন এলাকায় সেবা চালু থাকবে।" />
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(areas ?? []).map((a) => (
          <li
            key={a._id}
            className="flex items-center gap-4 rounded-lg border border-border bg-surface p-5"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700">
              <MapPin aria-hidden="true" className="size-4.5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-base font-semibold text-fg">{a.bnName}</span>
              <span className="text-xs tabular text-fg-tertiary">
                {formatCount(a.providerCount, "পেশাদার")}
              </span>
            </div>
            <Switch
              checked={a.isActive}
              aria-label={`${a.bnName} চালু রাখবেন কিনা`}
              onCheckedChange={() => void toggleAreaActive(a._id)}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

/* ==========================================================================
   Reports
   ========================================================================== */

export function AdminReportsView() {
  const m = ADMIN_METRICS;
  const { data: customers } = useCustomers();
  const { data: providers } = useAllProviders();

  return (
    <>
      <PageHeader title="রিপোর্ট" description="প্ল্যাটফর্মের বিস্তারিত পরিসংখ্যান।" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="মোট আয়"
          value={formatBdt(m.revenue, { compact: true })}
          delta={m.deltas.revenue}
        />
        <StatCard
          label="কমিশন"
          value={formatBdt(m.commission, { compact: true })}
          delta={m.deltas.commission}
        />
        <StatCard
          label="কমিশনের হার"
          value={formatPercent(12)}
          hint="প্রতি সম্পন্ন কাজে"
        />
        <StatCard
          label="গ্রাহক প্রতি পেশাদার"
          value={formatCount(
            Math.round(((providers ?? []).length / Math.max(1, (customers ?? []).length)) * 100) / 100,
          )}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-fg">আয়ের ধারা</h2>
          <AreaChart data={m.revenueByMonth} label="মাসভিত্তিক আয়" />
        </section>

        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-fg">বুকিংয়ের ধারা</h2>
          <BarChart data={m.bookingsByMonth} label="মাসভিত্তিক বুকিং" />
        </section>

        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 xl:col-span-2">
          <h2 className="text-lg font-semibold text-fg">সেবা অনুযায়ী বণ্টন</h2>
          <DonutChart data={m.bookingsByCategory} label="সেবার ধরন অনুযায়ী কাজ" />
        </section>
      </div>
    </>
  );
}

/* ==========================================================================
   Settings
   ========================================================================== */

export function AdminSettingsView() {
  const { resetDemo } = useMutations();
  const [pending, setPending] = useState(false);

  return (
    <>
      <PageHeader title="সেটিংস" description="প্ল্যাটফর্মের সাধারণ কনফিগারেশন।" />

      <div className="flex max-w-2xl flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-fg">কমিশন</h2>
          <div className="flex items-center justify-between gap-4">
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-fg">প্ল্যাটফর্ম কমিশন</span>
              <span className="text-xs text-fg-tertiary">প্রতিটি সম্পন্ন কাজে</span>
            </span>
            <span className="text-lg font-bold tabular text-fg">{formatPercent(12)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-fg">সর্বনিম্ন বুকিং মূল্য</span>
              <span className="text-xs text-fg-tertiary">এর নিচে কোটেশন দেওয়া যাবে না</span>
            </span>
            <span className="text-lg font-bold tabular text-fg">{formatBdt(300)}</span>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-fg">
            <Wrench aria-hidden="true" className="size-5 text-fg-tertiary" />
            ডেমো
          </h2>
          <p className="text-sm text-fg-secondary">
            এই প্রোটোটাইপের সব পরিবর্তন আপনার ব্রাউজারে সংরক্ষিত থাকে। শুরুর
            অবস্থায় ফিরে যেতে চাইলে নিচের বোতামটি চাপুন।
          </p>
          <Button
            variant="secondary"
            className="w-fit"
            loading={pending}
            onClick={async () => {
              setPending(true);
              try {
                await resetDemo();
              } finally {
                setPending(false);
              }
            }}
          >
            <RotateCcw aria-hidden="true" />
            ডেমো ডেটা রিসেট করুন
          </Button>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-fg">দ্রুত লিংক</h2>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href="/admin/services">সেবা</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/admin/locations">এলাকা</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/admin/verification">যাচাইকরণ</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/">পাবলিক সাইট</Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}

export { Avatar };
