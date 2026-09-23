"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  MapPin,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Rating } from "@/components/ui/rating";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PriceDisplay } from "@/components/ui/price-display";
import { DataTable, type Column } from "@/components/ui/data-table";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/app-shell/app-shell";
import { CategoryIcon } from "@/components/domain/category-icon";
import {
  ListSkeleton,
  ReviewSkeleton,
} from "@/components/skeletons";
import {
  useAddresses,
  useAreas,
  useCategoryById,
  useCurrentCustomer,
  useCustomerPayments,
  useCustomerReviews,
  useProviderById,
} from "@/lib/api/queries";
import { useMutations } from "@/lib/api/mutations";
import { formatBdt, formatDate } from "@/lib/format";
import { RelativeTime } from "@/components/ui/relative-time";
import { ACTIONS, EMPTY, PAYMENT_METHOD_BN, VALIDATION } from "@/lib/strings";
import type { Payment, Review } from "@/lib/types";

/* ==========================================================================
   Addresses
   ========================================================================== */

export function AddressesView() {
  const { data: addresses, isLoading, error, refetch } = useAddresses();
  const { data: areas } = useAreas();
  const { addAddress, deleteAddress, setDefaultAddress } = useMutations();

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({ label: "", line1: "", line2: "", areaId: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function save() {
    const next: Record<string, string> = {};
    if (!form.label.trim()) next.label = VALIDATION.required;
    if (!form.line1.trim()) next.line1 = VALIDATION.required;
    if (!form.areaId) next.areaId = VALIDATION.selectOne;
    setErrors(next);
    if (Object.keys(next).length) return;

    setPending(true);
    try {
      await addAddress({
        bnLabel: form.label,
        bnLine1: form.line1,
        bnLine2: form.line2,
        areaId: form.areaId,
        isDefault: (addresses ?? []).length === 0,
      });
      setForm({ label: "", line1: "", line2: "", areaId: "" });
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <PageHeader
        title="ঠিকানা"
        description="সংরক্ষিত ঠিকানা থাকলে বুকিং দ্রুত হয়।"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus aria-hidden="true" />
            ঠিকানা যোগ করুন
          </Button>
        }
      />

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <ListSkeleton count={2} />
      ) : (addresses ?? []).length === 0 ? (
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState
            {...EMPTY.addresses}
            icon={<MapPin />}
            onAction={() => setOpen(true)}
          />
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {(addresses ?? []).map((a) => {
            const area = (areas ?? []).find((x) => x._id === a.areaId);
            return (
              <li
                key={a._id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-muted text-fg-tertiary">
                      <MapPin aria-hidden="true" className="size-4" />
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-2 text-base font-semibold text-fg">
                        {a.bnLabel}
                        {a.isDefault && (
                          <Badge tone="accent" size="sm">
                            প্রধান
                          </Badge>
                        )}
                      </span>
                      <span className="text-sm text-fg-secondary">
                        {a.bnLine1}, {a.bnLine2}
                      </span>
                      <span className="text-sm text-fg-tertiary">{area?.bnName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-border-subtle pt-3">
                  {!a.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void setDefaultAddress(a._id)}
                    >
                      প্রধান করুন
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ms-auto text-danger-600 hover:bg-danger-50"
                    onClick={() => void deleteAddress(a._id)}
                  >
                    <Trash2 aria-hidden="true" />
                    {ACTIONS.delete}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent size="sm">
          <ModalHeader>
            <ModalTitle>নতুন ঠিকানা</ModalTitle>
          </ModalHeader>
          <ModalBody className="flex flex-col gap-4">
            <Field label="নাম" required error={errors.label} hint="যেমন: বাসা, অফিস">
              {(p) => (
                <Input
                  {...p}
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  invalid={!!errors.label}
                />
              )}
            </Field>
            <Field label="ঠিকানা" required error={errors.line1}>
              {(p) => (
                <Input
                  {...p}
                  value={form.line1}
                  onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
                  placeholder="বাড়ি নম্বর, রোড"
                  invalid={!!errors.line1}
                />
              )}
            </Field>
            <Field label="বিস্তারিত" optional>
              {(p) => (
                <Input
                  {...p}
                  value={form.line2}
                  onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))}
                  placeholder="ভবনের নাম, ফ্ল্যাট"
                />
              )}
            </Field>
            <Field label="এলাকা" required error={errors.areaId}>
              {(p) => (
                <Select
                  value={form.areaId}
                  onValueChange={(v) => setForm((f) => ({ ...f, areaId: v }))}
                >
                  <SelectTrigger id={p.id} invalid={!!errors.areaId}>
                    <SelectValue placeholder="এলাকা বেছে নিন" />
                  </SelectTrigger>
                  <SelectContent>
                    {(areas ?? []).map((a) => (
                      <SelectItem key={a._id} value={a._id}>
                        {a.bnName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {ACTIONS.cancel}
            </Button>
            <Button loading={pending} onClick={save}>
              {ACTIONS.save}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

/* ==========================================================================
   Payments
   ========================================================================== */

export function PaymentsView() {
  const { data: payments, isLoading, error, refetch } = useCustomerPayments();

  const columns: Column<Payment>[] = [
    {
      key: "date",
      header: "তারিখ",
      cell: (p) => (
        <span className="tabular">{formatDate(p.createdAt, "medium")}</span>
      ),
      sortBy: (p) => p.createdAt,
    },
    {
      key: "booking",
      header: "বুকিং",
      cell: (p) => (
        <Link
          href={`/customer/bookings/${p.bookingId}`}
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
  ];

  const total = (payments ?? [])
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <PageHeader
        title="পেমেন্ট"
        description="আপনার সব লেনদেনের হিসাব।"
        action={
          <div className="flex flex-col items-end">
            <span className="text-xs text-fg-tertiary">মোট পরিশোধিত</span>
            <span className="text-xl font-extrabold tabular text-fg">
              {formatBdt(total)}
            </span>
          </div>
        }
      />

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <DataTable
          data={payments ?? []}
          columns={columns}
          getRowId={(p) => p._id}
          isLoading={isLoading}
          caption="পেমেন্টের তালিকা"
          empty={
            <div className="rounded-lg border border-border bg-surface">
              <EmptyState {...EMPTY.payments} icon={<CreditCard />} />
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
                <Link
                  href={`/customer/bookings/${p.bookingId}`}
                  className="font-latin text-xs text-fg-accent underline-offset-4 hover:underline"
                  lang="en"
                >
                  {p.bookingId}
                </Link>
                <PriceDisplay amount={p.amount} size="md" />
              </div>
            </div>
          )}
        />
      )}
    </>
  );
}

/* ==========================================================================
   Reviews
   ========================================================================== */

export function ReviewsView() {
  const { data: reviews, isLoading, error, refetch } = useCustomerReviews();

  return (
    <>
      <PageHeader title="আমার রিভিউ" description="আপনি যেসব পেশাদারকে রেটিং দিয়েছেন।" />

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex flex-col gap-4">
          <ReviewSkeleton />
          <ReviewSkeleton />
        </div>
      ) : (reviews ?? []).length === 0 ? (
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState {...EMPTY.reviews} icon={<Star />} />
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {(reviews ?? []).map((r) => (
            <li key={r._id}>
              <MyReviewCard review={r} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function MyReviewCard({ review }: { review: Review }) {
  const { data: provider } = useProviderById(review.providerId);
  const { data: category } = useCategoryById(review.categoryId);

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {category && (
            <CategoryIcon icon={category.icon} tint={category.tint} size="sm" />
          )}
          <div className="flex flex-col gap-0.5">
            <Link
              href={`/providers/${provider?.slug ?? ""}`}
              className="text-sm font-semibold text-fg underline-offset-4 hover:underline"
            >
              {provider?.bnName}
            </Link>
            <span className="text-xs tabular text-fg-tertiary">
              {category?.bnShortName} · <RelativeTime value={review.createdAt} />
            </span>
          </div>
        </div>
        <Rating value={review.rating} size="sm" starsOnly />
      </div>
      <p className="text-sm text-fg-secondary">{review.bnBody}</p>
      {review.bnProviderReply && (
        <div className="rounded-md border-s-2 border-teal-300 bg-surface-muted px-4 py-3">
          <p className="mb-1 text-xs font-medium text-fg-tertiary">পেশাদারের উত্তর</p>
          <p className="text-sm text-fg-secondary">{review.bnProviderReply}</p>
        </div>
      )}
    </article>
  );
}

/* ==========================================================================
   Settings
   ========================================================================== */

export function CustomerSettingsView() {
  const { data: customer, isLoading } = useCurrentCustomer();
  const { data: areas } = useAreas();
  const { updateCustomerProfile } = useMutations();

  const [form, setForm] = useState({ bnName: "", phone: "", email: "" });
  const [pending, setPending] = useState(false);
  const [touched, setTouched] = useState(false);

  // Seed the form once the customer arrives, without an effect: the untouched
  // form simply mirrors the store.
  const values = touched
    ? form
    : {
        bnName: customer?.bnName ?? "",
        phone: customer?.phone ?? "",
        email: customer?.email ?? "",
      };

  function set(key: keyof typeof form, value: string) {
    setTouched(true);
    setForm({ ...values, [key]: value });
  }

  async function save() {
    setPending(true);
    try {
      // Phone is the login identity and is shown read-only; it is not sent.
      await updateCustomerProfile({ bnName: values.bnName, email: values.email });
      setTouched(false);
    } finally {
      setPending(false);
    }
  }

  const area = (areas ?? []).find((a) => a._id === customer?.areaId);

  if (isLoading) return <ListSkeleton count={3} />;

  return (
    <>
      <PageHeader title="সেটিংস" description="আপনার অ্যাকাউন্টের তথ্য।" />

      <div className="flex max-w-2xl flex-col gap-6">
        <section className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-fg">ব্যক্তিগত তথ্য</h2>

          <Field label="নাম" required>
            {(p) => (
              <Input
                {...p}
                value={values.bnName}
                onChange={(e) => set("bnName", e.target.value)}
              />
            )}
          </Field>

          <Field label="মোবাইল নম্বর" hint="লগ ইনের নম্বর — এখান থেকে বদলানো যায় না।">
            {(p) => (
              <Input
                {...p}
                type="tel"
                inputMode="numeric"
                value={values.phone}
                readOnly
                aria-readonly="true"
              />
            )}
          </Field>

          <Field label="ইমেইল" optional>
            {(p) => (
              <Input
                {...p}
                type="email"
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
              />
            )}
          </Field>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-fg">এলাকা</span>
              <span className="text-sm text-fg-tertiary">{area?.bnName}</span>
            </span>
            <Button asChild variant="ghost" size="sm">
              <Link href="/customer/addresses">ঠিকানা দেখুন</Link>
            </Button>
          </div>

          <Button
            className="w-fit"
            loading={pending}
            disabled={!touched}
            onClick={save}
          >
            {ACTIONS.saveChanges}
          </Button>
        </section>

        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-fg">অ্যাকাউন্ট</h2>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-fg-secondary">অবস্থা</span>
            <StatusBadge domain="account" status={customer?.status ?? "active"} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-fg-secondary">যোগ দিয়েছেন</span>
            <span className="text-sm tabular text-fg">
              {customer ? formatDate(customer.createdAt, "long") : "—"}
            </span>
          </div>
        </section>
      </div>
    </>
  );
}

export { cn };
