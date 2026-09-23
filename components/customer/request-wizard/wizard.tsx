"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CircleCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioCard } from "@/components/ui/radio-group";
import { CategoryIcon } from "@/components/domain/category-icon";
import {
  useAddresses,
  useAreas,
  useCategories,
  useRequestDraft,
} from "@/lib/api/queries";
import { useMutations } from "@/lib/api/mutations";
import { formatBdt, formatDate, toBn } from "@/lib/format";
import { shiftDays, TODAY } from "@/lib/data/clock";
import { ACTIONS, COMMON, SLOTS, SLOT_LABEL, VALIDATION } from "@/lib/strings";
import type { UrgencyLevel } from "@/lib/types";

const STEPS = [
  "সেবা",
  "বিস্তারিত",
  "ঠিকানা",
  "সময়",
  "বাজেট",
  "পর্যালোচনা",
];

const DAYS = Array.from({ length: 10 }, (_, i) => shiftDays(TODAY, i));

const URGENCIES: { value: UrgencyLevel; label: string; hint: string }[] = [
  { value: "flexible", label: "সময় নমনীয়", hint: "যেকোনো দিন হলেই চলবে" },
  { value: "soon", label: "শীঘ্রই দরকার", hint: "আগামী দুই-তিন দিনের মধ্যে" },
  { value: "urgent", label: "জরুরি", hint: "আজ বা কালই দরকার" },
];

/**
 * Six-step service request.
 *
 * Draft lives in the store, not in local state, so a half-finished request
 * survives navigating away and coming back — which is also what makes the
 * "resume your draft" behaviour possible. Each step validates before it
 * advances, so a demo can't walk past an empty form into a broken review.
 */
export function RequestWizard() {
  const params = useSearchParams();
  const draft = useRequestDraft();
  const { startDraft, patchDraft, setDraftStep, submitRequest, resetDraft } =
    useMutations();

  const { data: categories } = useCategories();
  const { data: areas } = useAreas();
  const { data: addresses } = useAddresses();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // Seed the draft from the query string the first time — the marketing hero,
  // the category pages and the provider booking panel all deep-link in here.
  useEffect(() => {
    if (draft) return;
    const categorySlug = params.get("category");
    const areaSlug = params.get("area");
    void startDraft({
      categoryId: (categories ?? []).find((c) => c.slug === categorySlug)?._id ?? null,
      areaId: (areas ?? []).find((a) => a.slug === areaSlug)?._id ?? null,
      preferredDate: params.get("date"),
      preferredSlot: params.get("slot"),
      step: categorySlug ? 1 : 0,
    });
  }, [draft, params, categories, areas, startDraft]);

  if (!draft) return null;

  const step = draft.step;

  function validate(current: number) {
    const next: Record<string, string> = {};
    if (current === 0 && !draft?.categoryId) next.category = VALIDATION.selectOne;
    if (current === 1) {
      if (!draft?.bnTitle.trim()) next.title = VALIDATION.required;
      if ((draft?.bnDescription.trim().length ?? 0) < 15)
        next.description = "আরও কিছু বিস্তারিত লিখুন";
    }
    if (current === 2 && !draft?.addressId && !draft?.bnAddressLine.trim())
      next.address = "একটি ঠিকানা বেছে নিন বা লিখুন";
    if (current === 3) {
      if (!draft?.preferredDate) next.date = VALIDATION.selectDate;
      if (!draft?.preferredSlot) next.slot = VALIDATION.selectOne;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function next() {
    if (!validate(step)) return;
    setDraftStep(Math.min(step + 1, STEPS.length - 1));
  }

  function back() {
    setErrors({});
    setDraftStep(Math.max(step - 1, 0));
  }

  async function submit() {
    setPending(true);
    try {
      const id = await submitRequest();
      setSubmittedId(id);
    } finally {
      setPending(false);
    }
  }

  const category = (categories ?? []).find((c) => c._id === draft.categoryId);
  const area = (areas ?? []).find((a) => a._id === draft.areaId);
  const address = (addresses ?? []).find((a) => a._id === draft.addressId);

  /* ---------------- step 6: submitted ---------------- */
  if (submittedId) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-5 py-10 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-success-50 text-success-600 animate-(--animate-scale-in)">
          <CircleCheck aria-hidden="true" className="size-8" />
        </span>
        <h1 className="text-3xl font-extrabold text-fg">অনুরোধ পাঠানো হয়েছে</h1>
        <p className="max-w-md text-base text-fg-secondary">
          আমাদের টিম আপনার কাজের জন্য উপযুক্ত পেশাদার খুঁজে দাম ঠিক করবে, তারপর কোটেশন
          পাঠাবে — সাধারণত কয়েক ঘণ্টার মধ্যেই।
        </p>
        <div className="mt-2 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
          <Button asChild size="lg">
            <Link href="/customer/requests">আমার অনুরোধ দেখুন</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/customer">ড্যাশবোর্ডে ফিরুন</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-fg md:text-3xl">সেবার অনুরোধ</h1>
        <p className="text-base text-fg-secondary">
          কয়েকটি প্রশ্নের উত্তর দিন, বাকিটা আমরা দেখছি।
        </p>
      </div>

      <Stepper steps={STEPS} current={step} />

      <div className="flex flex-col gap-6 rounded-xl border border-border bg-surface p-6 md:p-8">
        {/* ---------------- 1. category ---------------- */}
        {step === 0 && (
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-4 text-xl font-semibold text-fg">
              আপনার কোন সেবাটি দরকার?
            </legend>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {(categories ?? []).map((c) => {
                const on = draft.categoryId === c._id;
                return (
                  <button
                    key={c._id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => patchDraft({ categoryId: c._id })}
                    className={cn(
                      "flex flex-col items-start gap-2.5 rounded-lg border p-3.5 text-start",
                      "transition-[border-color,background-color,box-shadow] duration-(--duration-fast)",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                      on
                        ? "border-teal-600 bg-teal-50/60 shadow-focus"
                        : "border-border bg-surface hover:border-border-strong",
                    )}
                  >
                    <CategoryIcon icon={c.icon} tint={c.tint} size="sm" />
                    <span className="text-sm font-medium text-fg">{c.bnShortName}</span>
                  </button>
                );
              })}
            </div>
            {errors.category && (
              <p className="text-xs text-danger-600">{errors.category}</p>
            )}
          </fieldset>
        )}

        {/* ---------------- 2. details ---------------- */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-fg">আরেকটু বিস্তারিত বলুন</h2>

            <Field label="সমস্যাটি এক লাইনে" required error={errors.title}>
              {(p) => (
                <Input
                  {...p}
                  value={draft.bnTitle}
                  onChange={(e) => patchDraft({ bnTitle: e.target.value })}
                  placeholder="যেমন: রান্নাঘরের কল দিয়ে পানি পড়ছে"
                  invalid={!!errors.title}
                />
              )}
            </Field>

            <Field
              label="বিস্তারিত বিবরণ"
              required
              error={errors.description}
              hint="যত বিস্তারিত লিখবেন, আমাদের টিম তত সঠিক দাম জানাতে পারবে"
            >
              {(p) => (
                <Textarea
                  {...p}
                  rows={5}
                  value={draft.bnDescription}
                  onChange={(e) => patchDraft({ bnDescription: e.target.value })}
                  placeholder="কত দিন ধরে সমস্যা, আগে কেউ দেখেছে কিনা, কোন ব্র্যান্ড — যা জানেন লিখুন।"
                  invalid={!!errors.description}
                />
              )}
            </Field>
          </div>
        )}

        {/* ---------------- 3. address ---------------- */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-fg">কোথায় কাজটি করতে হবে?</h2>

            {(addresses ?? []).length > 0 && (
              <RadioGroup
                value={draft.addressId ?? ""}
                onValueChange={(v) => patchDraft({ addressId: v, bnAddressLine: "" })}
                className="flex flex-col gap-2.5"
              >
                {(addresses ?? []).map((a) => (
                  <RadioCard
                    key={a._id}
                    value={a._id}
                    label={a.bnLabel}
                    hint={`${a.bnLine1}, ${a.bnLine2}`}
                  />
                ))}
              </RadioGroup>
            )}

            <Field
              label="অথবা নতুন ঠিকানা লিখুন"
              error={errors.address}
              optional={(addresses ?? []).length > 0}
            >
              {(p) => (
                <Input
                  {...p}
                  value={draft.bnAddressLine}
                  onChange={(e) =>
                    patchDraft({ bnAddressLine: e.target.value, addressId: null })
                  }
                  placeholder="বাড়ি নম্বর, রোড, এলাকা"
                  invalid={!!errors.address}
                />
              )}
            </Field>

            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-2.5 text-sm font-medium text-fg">এলাকা</legend>
              <div className="flex flex-wrap gap-1.5">
                {(areas ?? []).map((a) => {
                  const on = draft.areaId === a._id;
                  return (
                    <button
                      key={a._id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => patchDraft({ areaId: a._id })}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium",
                        "transition-[border-color,background-color,color] duration-(--duration-fast)",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                        on
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-border bg-surface text-fg-secondary hover:border-border-strong",
                      )}
                    >
                      <span className="-translate-y-px">{a.bnName}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        )}

        {/* ---------------- 4. schedule ---------------- */}
        {step === 3 && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-semibold text-fg">কখন দরকার?</h2>

            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-2.5 text-sm font-medium text-fg">
                পছন্দের দিন <span className="text-danger-600">*</span>
              </legend>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {DAYS.map((d, i) => {
                  const on = draft.preferredDate === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={on}
                      onClick={() => patchDraft({ preferredDate: d })}
                      className={cn(
                        "flex min-w-16 shrink-0 flex-col items-center gap-0.5 rounded-md border px-2.5 py-2 text-xs",
                        "transition-[border-color,background-color,color] duration-(--duration-fast)",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                        on
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-border bg-surface text-fg-secondary hover:border-border-strong",
                      )}
                    >
                      <span>
                        {i === 0
                          ? COMMON.today
                          : i === 1
                            ? COMMON.tomorrow
                            : formatDate(d, "medium").split(",")[0]}
                      </span>
                      <span className="font-semibold tabular">
                        {formatDate(d, "short").slice(0, 5)}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.date && <p className="text-xs text-danger-600">{errors.date}</p>}
            </fieldset>

            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-2.5 text-sm font-medium text-fg">
                পছন্দের সময় <span className="text-danger-600">*</span>
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {SLOTS.map((s) => {
                  const on = draft.preferredSlot === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => patchDraft({ preferredSlot: s.key })}
                      className={cn(
                        "rounded-md border px-3 py-2.5 text-sm",
                        "transition-[border-color,background-color,color] duration-(--duration-fast)",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                        on
                          ? "border-teal-600 bg-teal-50 font-medium text-teal-800"
                          : "border-border bg-surface text-fg-secondary hover:border-border-strong",
                      )}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
              {errors.slot && <p className="text-xs text-danger-600">{errors.slot}</p>}
            </fieldset>

            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-2.5 text-sm font-medium text-fg">কতটা জরুরি?</legend>
              <RadioGroup
                value={draft.urgency}
                onValueChange={(v) => patchDraft({ urgency: v as UrgencyLevel })}
                className="flex flex-col gap-2.5"
              >
                {URGENCIES.map((u) => (
                  <RadioCard key={u.value} value={u.value} label={u.label} hint={u.hint} />
                ))}
              </RadioGroup>
            </fieldset>
          </div>
        )}

        {/* ---------------- 5. budget ---------------- */}
        {step === 4 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-fg">আপনার বাজেট কত?</h2>
            <p className="-mt-2 text-sm text-fg-secondary">
              ঐচ্ছিক। জানালে পেশাদাররা আপনার সামর্থ্য অনুযায়ী কোটেশন দেবেন।
              {category && (
                <>
                  {" "}
                  {category.bnShortName}-এর সাধারণ খরচ{" "}
                  <span className="font-medium tabular text-fg">
                    {formatBdt(category.priceFrom)} – {formatBdt(category.priceTo)}
                  </span>
                  ।
                </>
              )}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="সর্বনিম্ন (৳)" optional>
                {(p) => (
                  <Input
                    {...p}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={draft.budgetFrom ?? ""}
                    onChange={(e) =>
                      patchDraft({
                        budgetFrom: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="৫০০"
                  />
                )}
              </Field>
              <Field label="সর্বোচ্চ (৳)" optional>
                {(p) => (
                  <Input
                    {...p}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={draft.budgetTo ?? ""}
                    onChange={(e) =>
                      patchDraft({
                        budgetTo: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="২০০০"
                  />
                )}
              </Field>
            </div>
          </div>
        )}

        {/* ---------------- 6. review ---------------- */}
        {step === 5 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-fg">সব ঠিক আছে?</h2>

            <dl className="flex flex-col divide-y divide-border-subtle rounded-lg border border-border">
              {[
                { label: "সেবা", value: category?.bnName ?? "—" },
                { label: "সমস্যা", value: draft.bnTitle },
                { label: "বিবরণ", value: draft.bnDescription },
                {
                  label: "ঠিকানা",
                  value: address
                    ? `${address.bnLabel} — ${address.bnLine1}, ${address.bnLine2}`
                    : draft.bnAddressLine || "—",
                },
                { label: "এলাকা", value: area?.bnName ?? "—" },
                {
                  label: "সময়",
                  value: draft.preferredDate
                    ? `${formatDate(draft.preferredDate, "long")} · ${SLOT_LABEL[draft.preferredSlot ?? ""] ?? ""}`
                    : "—",
                },
                {
                  label: "জরুরি",
                  value: URGENCIES.find((u) => u.value === draft.urgency)?.label ?? "—",
                },
                {
                  label: "বাজেট",
                  value:
                    draft.budgetFrom || draft.budgetTo
                      ? `${formatBdt(draft.budgetFrom ?? 0)} – ${formatBdt(draft.budgetTo ?? 0)}`
                      : "উল্লেখ করা হয়নি",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-6"
                >
                  <dt className="shrink-0 text-sm text-fg-tertiary sm:w-28">
                    {row.label}
                  </dt>
                  <dd className="text-sm text-fg">{row.value}</dd>
                </div>
              ))}
            </dl>

            <p className="rounded-md bg-surface-muted px-4 py-3 text-sm text-fg-secondary">
              অনুরোধ পাঠাতে কোনো খরচ নেই। ঘরলি টিম পেশাদার ঠিক করে কোটেশন পাঠাবে — পছন্দ না হলে বুক করতে হবে না।
            </p>
          </div>
        )}

        {/* ---------------- nav ---------------- */}
        <div className="flex items-center gap-3 border-t border-border-subtle pt-5">
          {step > 0 ? (
            <Button variant="ghost" onClick={back}>
              <ArrowLeft aria-hidden="true" />
              {ACTIONS.back}
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => resetDraft()} asChild>
              <Link href="/customer">{ACTIONS.cancel}</Link>
            </Button>
          )}

          <span className="ms-auto text-xs tabular text-fg-tertiary">
            {toBn(step + 1)} / {toBn(STEPS.length)}
          </span>

          {step < STEPS.length - 1 ? (
            <Button onClick={next}>{ACTIONS.next}</Button>
          ) : (
            <Button loading={pending} onClick={submit}>
              {ACTIONS.submit}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
