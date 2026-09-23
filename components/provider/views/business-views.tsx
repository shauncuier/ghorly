"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CircleCheck,
  CircleDashed,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PriceDisplay } from "@/components/ui/price-display";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/app-shell/app-shell";
import { StatCard } from "@/components/app-shell/stat-card";
import { CategoryIcon } from "@/components/domain/category-icon";
import { ListSkeleton } from "@/components/skeletons";
import {
  useCategories,
  useCurrentProvider,
  useProviderBookings,
  useProviderEarnings,
  useProviderPayments,
  useProviderVerification,
} from "@/lib/api/queries";
import { useMutations } from "@/lib/api/mutations";
import {
  formatBdt,
  formatCount,
  formatDate,
  toBn,
  WEEKDAYS_SHORT,
} from "@/lib/format";
import { shiftDays, TODAY } from "@/lib/data/clock";
import { ACTIONS, EMPTY, PAYMENT_METHOD_BN, SLOTS, SLOT_LABEL } from "@/lib/strings";
import type { Payment } from "@/lib/types";

/* ==========================================================================
   Calendar
   ========================================================================== */

/** Four weeks from today — enough to plan, small enough to read on a phone. */
const CALENDAR_DAYS = Array.from({ length: 28 }, (_, i) => shiftDays(TODAY, i - 7));

export function ProviderCalendarView() {
  const { data: bookings, isLoading } = useProviderBookings();
  const [selected, setSelected] = useState<string>(TODAY);

  const byDate = new Map<string, number>();
  for (const b of bookings ?? []) {
    if (b.status === "cancelled") continue;
    byDate.set(b.scheduledDate, (byDate.get(b.scheduledDate) ?? 0) + 1);
  }

  const dayBookings = (bookings ?? []).filter(
    (b) => b.scheduledDate === selected && b.status !== "cancelled",
  );

  if (isLoading) return <ListSkeleton count={4} />;

  return (
    <>
      <PageHeader title="ক্যালেন্ডার" description="কোন দিন কোথায় কাজ আছে।" />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-3 grid grid-cols-7 gap-1.5">
            {WEEKDAYS_SHORT.map((d) => (
              <span
                key={d}
                className="py-1 text-center text-xs font-medium text-fg-tertiary"
              >
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {CALENDAR_DAYS.map((date) => {
              const count = byDate.get(date) ?? 0;
              const isSelected = date === selected;
              const isToday = date === TODAY;
              const day = Number(date.slice(8, 10));

              return (
                <button
                  key={date}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${formatDate(date, "long")} — ${formatCount(count, "কাজ")}`}
                  onClick={() => setSelected(date)}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center gap-1 rounded-md border text-sm",
                    "transition-[border-color,background-color,color] duration-(--duration-fast)",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                    isSelected
                      ? "border-teal-600 bg-teal-600 text-white"
                      : isToday
                        ? "border-teal-300 bg-teal-50 text-teal-800"
                        : "border-border bg-surface text-fg-secondary hover:border-border-strong",
                  )}
                >
                  <span className="font-medium tabular">{toBn(day)}</span>
                  {count > 0 && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-1.5 rounded-full",
                        isSelected ? "bg-white" : "bg-teal-600",
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="flex h-fit flex-col gap-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="text-base font-semibold text-fg">
            {formatDate(selected, "long")}
          </h2>

          {dayBookings.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-tertiary">
              এই দিনে কোনো কাজ নেই।
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {dayBookings.map((b) => (
                <li
                  key={b._id}
                  className="flex flex-col gap-1.5 rounded-lg border border-border-subtle bg-surface-muted p-3.5"
                >
                  <Link
                    href={`/provider/jobs/${b._id}`}
                    className="text-sm font-medium text-fg underline-offset-4 hover:underline"
                  >
                    {b.bnTitle}
                  </Link>
                  <span className="text-xs text-fg-tertiary">
                    {SLOT_LABEL[b.scheduledSlot] ?? b.scheduledSlot}
                  </span>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <StatusBadge domain="booking" status={b.status} size="sm" />
                    <PriceDisplay amount={b.amount} size="sm" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </>
  );
}

/* ==========================================================================
   Availability
   ========================================================================== */

export function ProviderAvailabilityView() {
  const { data: provider, isLoading } = useCurrentProvider();
  const { setAvailabilitySlot, bulkSetAvailability } = useMutations();

  if (isLoading || !provider) return <ListSkeleton count={4} />;

  return (
    <>
      <PageHeader
        title="সময়সূচি"
        description="কোন দিন কোন সময়ে কাজ নিতে পারবেন, ঠিক করে দিন।"
      />

      <div className="flex max-w-3xl flex-col gap-4">
        {WEEKDAYS_SHORT.map((dayName, weekday) => {
          const slots = provider.availability[weekday] ?? [];
          const allOn = slots.length === SLOTS.length;

          return (
            <section
              key={dayName}
              className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-2.5 text-base font-semibold text-fg">
                  {dayName}বার
                  {slots.length === 0 && (
                    <Badge tone="neutral" size="sm">
                      বন্ধ
                    </Badge>
                  )}
                </h2>
                <Switch
                  checked={slots.length > 0}
                  aria-label={`${dayName}বার কাজ করবেন কিনা`}
                  onCheckedChange={(on) =>
                    void bulkSetAvailability(
                      weekday,
                      on ? SLOTS.map((s) => s.key) : [],
                    )
                  }
                />
              </div>

              {slots.length > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {SLOTS.map((s) => {
                      const on = slots.includes(s.key);
                      return (
                        <button
                          key={s.key}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setAvailabilitySlot(weekday, s.key)}
                          className={cn(
                            "rounded-md border px-3 py-2 text-xs",
                            "transition-[border-color,background-color,color] duration-(--duration-fast)",
                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                            on
                              ? "border-teal-600 bg-teal-50 font-medium text-teal-800"
                              : "border-border bg-surface text-fg-tertiary hover:border-border-strong",
                          )}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>

                  {!allOn && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-fit"
                      onClick={() =>
                        void bulkSetAvailability(weekday, SLOTS.map((s) => s.key))
                      }
                    >
                      সব সময় নির্বাচন করুন
                    </Button>
                  )}
                </>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

/* ==========================================================================
   Services & pricing
   ========================================================================== */

export function ProviderServicesView() {
  const { data: provider, isLoading } = useCurrentProvider();
  const { data: categories } = useCategories();
  const { toggleServiceOffered, updateServicePrice } = useMutations();
  const [edits, setEdits] = useState<Record<string, string>>({});

  if (isLoading || !provider) return <ListSkeleton count={4} />;

  const mine = (categories ?? []).filter((c) => provider.categoryIds.includes(c._id));
  const others = (categories ?? []).filter((c) => !provider.categoryIds.includes(c._id));

  return (
    <>
      <PageHeader
        title="আমার সেবা"
        description="কোন কাজগুলো করেন এবং কত দর নেন।"
      />

      <div className="flex max-w-3xl flex-col gap-8">
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-fg">আপনার সেবা</h2>
          <ul className="flex flex-col gap-3">
            {mine.map((c) => {
              const active = provider.activeCategoryIds.includes(c._id);
              const price = provider.categoryPricing[c._id] ?? provider.priceFrom;
              const draft = edits[c._id] ?? String(price);

              return (
                <li
                  key={c._id}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <CategoryIcon icon={c.icon} tint={c.tint} size="md" />
                      <div className="flex min-w-0 flex-col">
                        <span className="text-base font-semibold text-fg">
                          {c.bnShortName}
                        </span>
                        <span className="truncate-bn text-sm text-fg-tertiary">
                          {c.bnName}
                        </span>
                      </div>
                    </div>
                    <Switch
                      checked={active}
                      aria-label={`${c.bnShortName} সেবা চালু রাখবেন কিনা`}
                      onCheckedChange={() => void toggleServiceOffered(c._id)}
                    />
                  </div>

                  {active && (
                    <div className="flex items-end gap-3 border-t border-border-subtle pt-4">
                      <Field label="আপনার শুরুর দর (৳)" className="flex-1">
                        {(p) => (
                          <Input
                            {...p}
                            type="number"
                            inputMode="numeric"
                            min={1}
                            value={draft}
                            onChange={(e) =>
                              setEdits((s) => ({ ...s, [c._id]: e.target.value }))
                            }
                          />
                        )}
                      </Field>
                      <Button
                        variant="secondary"
                        disabled={Number(draft) === price || !draft}
                        onClick={() =>
                          void updateServicePrice(c._id, Number(draft))
                        }
                      >
                        {ACTIONS.save}
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {others.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-fg">আরও সেবা যোগ করুন</h2>
            <p className="-mt-2 text-sm text-fg-secondary">
              বেশি সেবা যোগ করলে বেশি অনুরোধ পাবেন।
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {others.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center gap-2.5 rounded-lg border border-dashed border-border p-3 opacity-70"
                >
                  <CategoryIcon icon={c.icon} tint={c.tint} size="sm" />
                  <span className="min-w-0 truncate-bn text-sm text-fg-secondary">
                    {c.bnShortName}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

/* ==========================================================================
   Earnings
   ========================================================================== */

export function ProviderEarningsView() {
  const { data: earnings } = useProviderEarnings();
  const { data: payments, isLoading } = useProviderPayments();
  const { requestPayout } = useMutations();
  const [pending, setPending] = useState(false);

  const columns: Column<Payment>[] = [
    {
      key: "date",
      header: "তারিখ",
      cell: (p) => <span className="tabular">{formatDate(p.createdAt, "medium")}</span>,
      sortBy: (p) => p.createdAt,
    },
    {
      key: "booking",
      header: "কাজ",
      cell: (p) => (
        <Link
          href={`/provider/jobs/${p.bookingId}`}
          className="font-latin text-sm text-fg-accent underline-offset-4 hover:underline"
          lang="en"
        >
          {p.bookingId}
        </Link>
      ),
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
      hideBelow: "md",
    },
    {
      key: "status",
      header: "অবস্থা",
      cell: (p) => <StatusBadge domain="payment" status={p.status} size="sm" />,
    },
    {
      key: "net",
      header: "আপনার আয়",
      align: "end",
      cell: (p) => <PriceDisplay amount={p.amount - p.commission} size="sm" />,
      sortBy: (p) => p.amount - p.commission,
    },
  ];

  return (
    <>
      <PageHeader
        title="আয়"
        description="আপনার উপার্জন ও লেনদেনের হিসাব।"
        action={
          <Button
            loading={pending}
            disabled={(earnings?.paid ?? 0) <= 0}
            onClick={async () => {
              setPending(true);
              try {
                await requestPayout(earnings?.paid ?? 0);
              } finally {
                setPending(false);
              }
            }}
          >
            <Wallet aria-hidden="true" />
            {ACTIONS.requestPayout}
          </Button>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="মোট আয়"
          value={formatBdt(earnings?.paid ?? 0)}
          icon={<Wallet />}
          tone="accent"
        />
        <StatCard
          label="এই মাসে"
          value={formatBdt(earnings?.thisMonth ?? 0)}
          delta={18}
          icon={<TrendingUp />}
        />
        <StatCard
          label="বকেয়া"
          value={formatBdt(earnings?.pending ?? 0)}
          hint="কাজ শেষ হলে যোগ হবে"
          icon={<CircleDashed />}
        />
        <StatCard
          label="প্ল্যাটফর্ম কমিশন"
          value={formatBdt(earnings?.commission ?? 0)}
          hint={formatCount(earnings?.completedCount ?? 0, "কাজ")}
          icon={<CircleCheck />}
        />
      </div>

      <h2 className="mb-4 text-lg font-semibold text-fg">লেনদেন</h2>
      <DataTable
        data={payments ?? []}
        columns={columns}
        getRowId={(p) => p._id}
        isLoading={isLoading}
        caption="আয়ের তালিকা"
        empty={
          <div className="rounded-lg border border-border bg-surface">
            <EmptyState {...EMPTY.providerEarnings} icon={<Wallet />} />
          </div>
        }
        renderMobileCard={(p) => (
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-fg">
                  {PAYMENT_METHOD_BN[p.method]}
                </span>
                <span className="text-xs tabular text-fg-tertiary">
                  {formatDate(p.createdAt, "medium")}
                </span>
              </span>
              <StatusBadge domain="payment" status={p.status} size="sm" />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border-subtle pt-3">
              <span className="text-xs tabular text-fg-tertiary">
                কমিশন {formatBdt(p.commission)}
              </span>
              <PriceDisplay amount={p.amount - p.commission} size="md" />
            </div>
          </div>
        )}
      />
    </>
  );
}

/* ==========================================================================
   Verification
   ========================================================================== */

export function ProviderVerificationView() {
  const { data: provider } = useCurrentProvider();
  const { data: verification, isLoading } = useProviderVerification();
  const { submitVerificationDoc } = useMutations();
  const [pendingKind, setPendingKind] = useState<string | null>(null);

  if (isLoading || !verification) return <ListSkeleton count={3} />;

  const submitted = verification.docs.filter((d) => d.isSubmitted).length;

  return (
    <>
      <PageHeader
        title="যাচাইকরণ"
        description="যাচাইকৃত পেশাদাররা গড়ে তিনগুণ বেশি অনুরোধ পান।"
        action={<StatusBadge domain="verification" status={verification.status} size="lg" />}
      />

      <div className="flex max-w-2xl flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold text-fg">কাগজপত্র</h2>
            <span className="text-sm tabular text-fg-tertiary">
              {toBn(submitted)} / {toBn(verification.docs.length)} জমা হয়েছে
            </span>
          </div>

          <ul className="flex flex-col divide-y divide-border-subtle">
            {verification.docs.map((doc) => (
              <li
                key={doc.kind}
                className="flex items-center justify-between gap-4 py-3.5"
              >
                <span className="flex items-center gap-3">
                  {doc.isSubmitted ? (
                    <CircleCheck
                      aria-hidden="true"
                      className="size-5 shrink-0 text-success-600"
                    />
                  ) : (
                    <CircleDashed
                      aria-hidden="true"
                      className="size-5 shrink-0 text-fg-disabled"
                    />
                  )}
                  <span className="text-sm text-fg">{doc.bnLabel}</span>
                </span>

                {doc.isSubmitted ? (
                  <Badge tone="success" size="sm">
                    জমা হয়েছে
                  </Badge>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={pendingKind === doc.kind}
                    onClick={async () => {
                      setPendingKind(doc.kind);
                      try {
                        await submitVerificationDoc(doc.kind);
                      } finally {
                        setPendingKind(null);
                      }
                    }}
                  >
                    জমা দিন
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>

        {verification.bnNote && (
          <p
            className={cn(
              "rounded-md px-4 py-3 text-sm",
              verification.status === "rejected"
                ? "bg-danger-50 text-danger-700"
                : "bg-success-50 text-success-700",
            )}
          >
            {verification.bnNote}
          </p>
        )}

        <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-fg">যাচাই হলে কী হবে</h2>
          <ul className="flex flex-col gap-2 text-sm text-fg-secondary">
            <li>· আপনার প্রোফাইলে &lsquo;যাচাইকৃত&rsquo; চিহ্ন যুক্ত হবে</li>
            <li>· খোঁজার ফলাফলে আপনি উপরে থাকবেন</li>
            <li>· গ্রাহকরা যাচাইকৃত পেশাদারদের বেশি বিশ্বাস করেন</li>
          </ul>
          {provider?.isVerified && (
            <p className="mt-1 text-sm font-medium text-success-700">
              আপনার প্রোফাইল ইতিমধ্যে যাচাইকৃত।
            </p>
          )}
        </section>
      </div>
    </>
  );
}

/* ==========================================================================
   Settings
   ========================================================================== */

export function ProviderSettingsView() {
  const { data: provider, isLoading } = useCurrentProvider();
  const { updateProviderProfile } = useMutations();
  const [form, setForm] = useState({ bnTitle: "", bnBio: "", priceFrom: "" });
  const [touched, setTouched] = useState(false);
  const [pending, setPending] = useState(false);

  const values = touched
    ? form
    : {
        bnTitle: provider?.bnTitle ?? "",
        bnBio: provider?.bnBio ?? "",
        priceFrom: String(provider?.priceFrom ?? ""),
      };

  function set(key: keyof typeof form, value: string) {
    setTouched(true);
    setForm({ ...values, [key]: value });
  }

  if (isLoading || !provider) return <ListSkeleton count={3} />;

  return (
    <>
      <PageHeader title="সেটিংস" description="আপনার প্রোফাইল ও ব্যবসার তথ্য।" />

      <div className="flex max-w-2xl flex-col gap-6">
        <section className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-fg">প্রোফাইল</h2>

          <Field label="পেশা" required hint="গ্রাহকরা এটিই প্রথমে দেখেন">
            {(p) => (
              <Input
                {...p}
                value={values.bnTitle}
                onChange={(e) => set("bnTitle", e.target.value)}
              />
            )}
          </Field>

          <Field label="নিজের সম্পর্কে" required>
            {(p) => (
              <Textarea
                {...p}
                rows={5}
                value={values.bnBio}
                onChange={(e) => set("bnBio", e.target.value)}
              />
            )}
          </Field>

          <Field label="সর্বনিম্ন দর (৳)" required>
            {(p) => (
              <Input
                {...p}
                type="number"
                inputMode="numeric"
                min={1}
                value={values.priceFrom}
                onChange={(e) => set("priceFrom", e.target.value)}
              />
            )}
          </Field>

          <Button
            className="w-fit"
            loading={pending}
            disabled={!touched}
            onClick={async () => {
              setPending(true);
              try {
                await updateProviderProfile({
                  bnTitle: values.bnTitle,
                  bnBio: values.bnBio,
                  priceFrom: Number(values.priceFrom),
                });
                setTouched(false);
              } finally {
                setPending(false);
              }
            }}
          >
            {ACTIONS.saveChanges}
          </Button>
        </section>

        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-fg">অ্যাকাউন্ট</h2>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-fg-secondary">অবস্থা</span>
            <StatusBadge domain="account" status={provider.status} />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-fg-secondary">যোগ দিয়েছেন</span>
            <span className="text-sm tabular text-fg">
              {formatDate(provider.joinedAt, "long")}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-fg-secondary">পাবলিক প্রোফাইল</span>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/providers/${provider.slug}`}>{ACTIONS.viewProfile}</Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
