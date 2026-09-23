"use client";

import { useState } from "react";
import Link from "next/link";
import { Ban, CircleCheck, RotateCcw, ShieldCheck, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { Textarea } from "@/components/ui/textarea";
import { SearchInput } from "@/components/ui/search-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type Column } from "@/components/ui/data-table";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { PageHeader } from "@/components/app-shell/app-shell";
import { VerifiedBadge } from "@/components/domain/verified-badge";
import {
  useAllProviders,
  useAreaById,
  useCustomers,
  useProviderById,
  useVerifications,
} from "@/lib/api/queries";
import { useMutations } from "@/lib/api/mutations";
import { formatBdt, formatCount, formatDate, formatPhone } from "@/lib/format";
import { ACTIONS, EMPTY } from "@/lib/strings";
import type { Customer, Provider, Verification } from "@/lib/types";

/* ==========================================================================
   Customers
   ========================================================================== */

export function AdminCustomersView() {
  const { data: customers, isLoading } = useCustomers();
  const { suspendUser, reinstateUser } = useMutations();
  const [query, setQuery] = useState("");

  const rows = (customers ?? []).filter(
    (c) => !query.trim() || c.bnName.includes(query.trim()) || c.phone.includes(query.trim()),
  );

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "গ্রাহক",
      cell: (c) => (
        <span className="flex items-center gap-3">
          <Avatar id={c._id} name={c.bnName} size="xs" />
          <span className="flex flex-col">
            <span className="text-sm font-medium text-fg">{c.bnName}</span>
            <span className="text-xs tabular text-fg-tertiary">
              {formatPhone(c.phone)}
            </span>
          </span>
        </span>
      ),
      sortBy: (c) => c.bnName,
    },
    {
      key: "bookings",
      header: "বুকিং",
      align: "end",
      cell: (c) => formatCount(c.bookingCount),
      sortBy: (c) => c.bookingCount,
      hideBelow: "md",
    },
    {
      key: "joined",
      header: "যোগ দিয়েছেন",
      cell: (c) => formatDate(c.createdAt, "medium"),
      sortBy: (c) => c.createdAt,
      hideBelow: "lg",
    },
    {
      key: "status",
      header: "অবস্থা",
      cell: (c) => <StatusBadge domain="account" status={c.status} size="sm" />,
    },
    {
      key: "actions",
      header: "",
      align: "end",
      cell: (c) =>
        c.status === "active" ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-danger-600 hover:bg-danger-50"
            onClick={() => void suspendUser(c._id, "customer")}
          >
            <Ban aria-hidden="true" />
            {ACTIONS.suspend}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void reinstateUser(c._id, "customer")}
          >
            <RotateCcw aria-hidden="true" />
            {ACTIONS.reinstate}
          </Button>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="গ্রাহক"
        description={`মোট ${formatCount((customers ?? []).length, "গ্রাহক")} নিবন্ধিত।`}
      />
      <div className="mb-5 max-w-sm">
        <SearchInput
          value={query}
          onValueChange={setQuery}
          placeholder="নাম বা নম্বর খুঁজুন…"
        />
      </div>
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(c) => c._id}
        isLoading={isLoading}
        caption="গ্রাহকের তালিকা"
        empty={<EmptyState title="কোনো গ্রাহক নেই" body="খোঁজার শর্ত বদলে দেখুন।" />}
        renderMobileCard={(c) => (
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              <Avatar id={c._id} name={c.bnName} size="sm" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate-bn text-sm font-medium text-fg">{c.bnName}</span>
                <span className="text-xs tabular text-fg-tertiary">
                  {formatPhone(c.phone)}
                </span>
              </span>
              <StatusBadge domain="account" status={c.status} size="sm" />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border-subtle pt-3">
              <span className="text-xs tabular text-fg-tertiary">
                {formatCount(c.bookingCount, "বুকিং")}
              </span>
              {c.status === "active" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger-600"
                  onClick={() => void suspendUser(c._id, "customer")}
                >
                  {ACTIONS.suspend}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void reinstateUser(c._id, "customer")}
                >
                  {ACTIONS.reinstate}
                </Button>
              )}
            </div>
          </div>
        )}
      />
    </>
  );
}

/* ==========================================================================
   Professionals
   ========================================================================== */

export function AdminProvidersView() {
  const { data: providers, isLoading } = useAllProviders();
  const { suspendUser, reinstateUser } = useMutations();
  const [query, setQuery] = useState("");

  const rows = (providers ?? []).filter(
    (p) => !query.trim() || p.bnName.includes(query.trim()) || p.bnTitle.includes(query.trim()),
  );

  const columns: Column<Provider>[] = [
    {
      key: "name",
      header: "পেশাদার",
      cell: (p) => (
        <span className="flex items-center gap-3">
          <Avatar id={p._id} name={p.bnName} size="xs" />
          <span className="flex min-w-0 flex-col">
            <span className="flex items-center gap-1.5 text-sm font-medium text-fg">
              <Link
                href={`/providers/${p.slug}`}
                className="underline-offset-4 hover:underline"
              >
                {p.bnName}
              </Link>
              {p.isVerified && <VerifiedBadge size="sm" showLabel={false} />}
            </span>
            <span className="truncate-bn text-xs text-fg-tertiary">{p.bnTitle}</span>
          </span>
        </span>
      ),
      sortBy: (p) => p.bnName,
    },
    {
      key: "rating",
      header: "রেটিং",
      cell: (p) => <Rating value={p.rating} size="sm" compact />,
      sortBy: (p) => p.rating,
      hideBelow: "md",
    },
    {
      key: "jobs",
      header: "কাজ",
      align: "end",
      cell: (p) => formatCount(p.completedJobs),
      sortBy: (p) => p.completedJobs,
      hideBelow: "md",
    },
    {
      key: "price",
      header: "শুরুর দর",
      align: "end",
      cell: (p) => formatBdt(p.priceFrom),
      sortBy: (p) => p.priceFrom,
      hideBelow: "lg",
    },
    {
      key: "status",
      header: "অবস্থা",
      cell: (p) => <StatusBadge domain="account" status={p.status} size="sm" />,
    },
    {
      key: "actions",
      header: "",
      align: "end",
      cell: (p) =>
        p.status === "active" ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-danger-600 hover:bg-danger-50"
            onClick={() => void suspendUser(p._id, "provider")}
          >
            {ACTIONS.suspend}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void reinstateUser(p._id, "provider")}
          >
            {ACTIONS.reinstate}
          </Button>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="পেশাদার"
        description={`মোট ${formatCount((providers ?? []).length, "পেশাদার")} নিবন্ধিত।`}
      />
      <div className="mb-5 max-w-sm">
        <SearchInput
          value={query}
          onValueChange={setQuery}
          placeholder="নাম বা পেশা খুঁজুন…"
        />
      </div>
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(p) => p._id}
        isLoading={isLoading}
        caption="পেশাদারের তালিকা"
        empty={<EmptyState title="কোনো পেশাদার নেই" body="খোঁজার শর্ত বদলে দেখুন।" />}
        renderMobileCard={(p) => (
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              <Avatar id={p._id} name={p.bnName} size="sm" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-1.5 truncate-bn text-sm font-medium text-fg">
                  {p.bnName}
                  {p.isVerified && <VerifiedBadge size="sm" showLabel={false} />}
                </span>
                <span className="truncate-bn text-xs text-fg-tertiary">{p.bnTitle}</span>
              </span>
              <Rating value={p.rating} size="sm" compact />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border-subtle pt-3">
              <StatusBadge domain="account" status={p.status} size="sm" />
              <span className="text-xs tabular text-fg-tertiary">
                {formatCount(p.completedJobs, "কাজ")}
              </span>
            </div>
          </div>
        )}
      />
    </>
  );
}

/* ==========================================================================
   Verification queue
   ========================================================================== */

export function AdminVerificationView() {
  const { data: verifications, isLoading } = useVerifications();
  const [reviewing, setReviewing] = useState<Verification | null>(null);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const { approveVerification, rejectVerification } = useMutations();

  const queue = (verifications ?? []).filter((v) => v.status === "pending");
  const decided = (verifications ?? []).filter((v) => v.status !== "pending");

  async function decide(approve: boolean) {
    if (!reviewing) return;
    setPending(true);
    try {
      if (approve) await approveVerification(reviewing._id);
      else await rejectVerification(reviewing._id, note || "কাগজপত্র যথেষ্ট নয়।");
      setReviewing(null);
      setNote("");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <PageHeader
        title="যাচাইকরণ"
        description="পেশাদারদের জমা দেওয়া কাগজপত্র পরীক্ষা করুন।"
        action={
          queue.length > 0 && (
            <Badge tone="warning" size="lg" className="tabular">
              {formatCount(queue.length, "অপেক্ষমাণ")}
            </Badge>
          )
        }
      />

      {isLoading ? null : queue.length === 0 ? (
        <div className="mb-8 rounded-lg border border-border bg-surface">
          <EmptyState {...EMPTY.verifications} icon={<ShieldCheck />} />
        </div>
      ) : (
        <ul className="mb-10 grid gap-4 xl:grid-cols-2">
          {queue.map((v) => (
            <li key={v._id}>
              <VerificationCard verification={v} onReview={() => setReviewing(v)} />
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-4 text-lg font-semibold text-fg">নিষ্পত্তি হওয়া</h2>
      <ul className="flex flex-col divide-y divide-border-subtle rounded-lg border border-border bg-surface">
        {decided.slice(0, 12).map((v) => (
          <li key={v._id}>
            <DecidedRow verification={v} />
          </li>
        ))}
      </ul>

      {/* review drawer */}
      <Drawer open={reviewing !== null} onOpenChange={(o) => !o && setReviewing(null)}>
        <DrawerContent side="right">
          <DrawerHeader>
            <DrawerTitle>কাগজপত্র পরীক্ষা</DrawerTitle>
          </DrawerHeader>
          <DrawerBody className="flex flex-col gap-5">
            {reviewing && <VerificationDetail verification={reviewing} />}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ver-note" className="text-sm font-medium text-fg">
                মন্তব্য
              </label>
              <Textarea
                id="ver-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="প্রত্যাখ্যান করলে কারণ লিখুন…"
              />
            </div>
          </DrawerBody>
          <DrawerFooter>
            <Button
              variant="secondary"
              className="flex-1"
              loading={pending}
              onClick={() => void decide(false)}
            >
              <X aria-hidden="true" />
              {ACTIONS.reject}
            </Button>
            <Button className="flex-1" loading={pending} onClick={() => void decide(true)}>
              <CircleCheck aria-hidden="true" />
              {ACTIONS.approve}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function VerificationCard({
  verification,
  onReview,
}: {
  verification: Verification;
  onReview: () => void;
}) {
  const { data: provider } = useProviderById(verification.providerId);
  const { data: area } = useAreaById(provider?.areaId ?? null);
  if (!provider) return null;

  const submitted = verification.docs.filter((d) => d.isSubmitted).length;

  return (
    <article className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start gap-3.5">
        <Avatar id={provider._id} name={provider.bnName} size="lg" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="text-base font-semibold text-fg">{provider.bnName}</h3>
          <p className="truncate-bn text-sm text-fg-tertiary">{provider.bnTitle}</p>
          <p className="text-xs text-fg-tertiary">
            {area?.bnName} · যোগ দিয়েছেন {formatDate(provider.joinedAt, "medium")}
          </p>
        </div>
      </div>

      <ul className="flex flex-wrap gap-1.5">
        {verification.docs.map((d) => (
          <li key={d.kind}>
            <Badge tone={d.isSubmitted ? "success" : "neutral"} size="sm">
              {d.bnLabel}
            </Badge>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
        <span className="text-xs tabular text-fg-tertiary">
          {formatCount(submitted)} / {formatCount(verification.docs.length)} কাগজ জমা
        </span>
        <Button size="sm" onClick={onReview}>
          পরীক্ষা করুন
        </Button>
      </div>
    </article>
  );
}

function VerificationDetail({ verification }: { verification: Verification }) {
  const { data: provider } = useProviderById(verification.providerId);
  if (!provider) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3.5">
        <Avatar id={provider._id} name={provider.bnName} size="lg" />
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-semibold text-fg">{provider.bnName}</span>
          <span className="text-sm text-fg-tertiary">{provider.bnTitle}</span>
          <span className="text-xs tabular text-fg-tertiary">
            {formatPhone(provider.phone)}
          </span>
        </div>
      </div>

      <dl className="flex flex-col divide-y divide-border-subtle rounded-lg border border-border">
        {verification.docs.map((d) => (
          <div key={d.kind} className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-fg">{d.bnLabel}</dt>
            <dd>
              <Badge tone={d.isSubmitted ? "success" : "neutral"} size="sm">
                {d.isSubmitted ? "জমা হয়েছে" : "জমা হয়নি"}
              </Badge>
            </dd>
          </div>
        ))}
      </dl>

      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-fg-tertiary">অভিজ্ঞতা</dt>
          <dd className="tabular text-fg">{formatCount(provider.experienceYears, "বছর")}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-fg-tertiary">সম্পন্ন কাজ</dt>
          <dd className="tabular text-fg">{formatCount(provider.completedJobs)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-fg-tertiary">জমা দেওয়ার তারিখ</dt>
          <dd className="tabular text-fg">
            {formatDate(verification.submittedAt, "long")}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function DecidedRow({ verification }: { verification: Verification }) {
  const { data: provider } = useProviderById(verification.providerId);
  if (!provider) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">
      <Avatar id={provider._id} name={provider.bnName} size="xs" />
      <span className="min-w-0 flex-1 truncate-bn text-sm font-medium text-fg">
        {provider.bnName}
      </span>
      <StatusBadge domain="verification" status={verification.status} size="sm" />
      <span className="text-xs tabular text-fg-tertiary">
        {verification.reviewedAt ? formatDate(verification.reviewedAt, "medium") : "—"}
      </span>
    </div>
  );
}
