"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckboxField } from "@/components/ui/checkbox";
import { Stepper } from "@/components/ui/stepper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryIcon } from "@/components/domain/category-icon";
import { CATEGORIES } from "@/lib/data/categories";
import { AREAS } from "@/lib/data/areas";
import { toast } from "@/lib/toast";
import { ACTIONS, VALIDATION } from "@/lib/strings";

const STEPS = ["পরিচয়", "আপনার কাজ", "এলাকা ও দর", "যাচাইকরণ"];

/**
 * Four-step provider signup.
 *
 * Each step validates before advancing, so a customer demo can't accidentally
 * walk past an empty form and land on a broken review screen.
 */
export function ProviderRegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "",
    phone: "",
    title: "",
    bio: "",
    categories: [] as string[],
    areas: [] as string[],
    priceFrom: "",
    experience: "",
    nid: false,
    photo: false,
    agreed: false,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggle(key: "categories" | "areas", id: string) {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(id) ? f[key].filter((x) => x !== id) : [...f[key], id],
    }));
  }

  function validate(current: number) {
    const next: Record<string, string> = {};
    if (current === 0) {
      if (!form.name.trim()) next.name = VALIDATION.required;
      if (!/^01\d{9}$/.test(form.phone.replace(/\D/g, ""))) next.phone = VALIDATION.phone;
    }
    if (current === 1) {
      if (!form.title.trim()) next.title = VALIDATION.required;
      if (form.bio.trim().length < 20) next.bio = "অন্তত কয়েকটি বাক্য লিখুন";
      if (form.categories.length === 0) next.categories = "অন্তত একটি সেবা বেছে নিন";
    }
    if (current === 2) {
      if (form.areas.length === 0) next.areas = "অন্তত একটি এলাকা বেছে নিন";
      if (!form.priceFrom || Number(form.priceFrom) <= 0)
        next.priceFrom = VALIDATION.positiveAmount;
      if (!form.experience) next.experience = VALIDATION.required;
    }
    if (current === 3) {
      if (!form.nid) next.nid = "জাতীয় পরিচয়পত্র জমা দিন";
      if (!form.agreed) next.agreed = "শর্তাবলীতে সম্মতি দিন";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function next() {
    if (!validate(step)) return;
    setStep((s) => s + 1);
  }

  async function submit() {
    if (!validate(3)) return;
    setPending(true);
    await new Promise((r) => setTimeout(r, 700));
    setPending(false);
    setDone(true);
    toast.success("আবেদন জমা হয়েছে", {
      description: "যাচাই সম্পন্ন হলে আমরা জানাব।",
    });
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-success-50 text-success-600">
          <CircleCheck aria-hidden="true" className="size-8" />
        </span>
        <h1 className="text-3xl font-extrabold text-fg">আবেদন জমা হয়েছে</h1>
        <p className="max-w-sm text-base text-fg-secondary">
          আপনার কাগজপত্র যাচাই করতে সাধারণত এক থেকে দুই কর্মদিবস লাগে। যাচাই
          সম্পন্ন হলে আপনার প্রোফাইলে &lsquo;যাচাইকৃত&rsquo; চিহ্ন যোগ হবে।
        </p>
        <div className="mt-2 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
          <Button size="lg" onClick={() => router.push("/provider")}>
            ড্যাশবোর্ড দেখুন
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/">হোমে ফিরুন</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-fg">পেশাদার হিসেবে যোগ দিন</h1>
        <p className="text-base text-fg-secondary">
          নিবন্ধন বিনামূল্যে। মাসিক কোনো ফি নেই।
        </p>
      </div>

      <Stepper steps={STEPS} current={step} />

      {/* ---------- step 1 ---------- */}
      {step === 0 && (
        <div className="flex flex-col gap-5">
          <Field label="আপনার নাম" required error={errors.name}>
            {(p) => (
              <Input
                {...p}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="পুরো নাম"
                invalid={!!errors.name}
              />
            )}
          </Field>
          <Field label="মোবাইল নম্বর" required error={errors.phone} hint="গ্রাহক কেবল বুকিং নিশ্চিত হলেই দেখবেন">
            {(p) => (
              <Input
                {...p}
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="০১XXXXXXXXX"
                invalid={!!errors.phone}
              />
            )}
          </Field>
        </div>
      )}

      {/* ---------- step 2 ---------- */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <Field label="আপনার পেশা" required error={errors.title} hint="যেমন: এসি ও কুলিং বিশেষজ্ঞ">
            {(p) => (
              <Input
                {...p}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                invalid={!!errors.title}
              />
            )}
          </Field>

          <Field label="নিজের সম্পর্কে" required error={errors.bio}>
            {(p) => (
              <Textarea
                {...p}
                rows={4}
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                placeholder="কত বছর কাজ করছেন, কোন কাজে দক্ষ — সংক্ষেপে লিখুন।"
                invalid={!!errors.bio}
              />
            )}
          </Field>

          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2.5 text-sm font-medium text-fg">
              কোন সেবাগুলো দেন? <span className="text-danger-600">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => {
                const on = form.categories.includes(c._id);
                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => toggle("categories", c._id)}
                    aria-pressed={on}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border p-2.5 text-start",
                      "transition-[border-color,background-color] duration-(--duration-fast)",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                      on
                        ? "border-teal-600 bg-teal-50/60"
                        : "border-border bg-surface hover:border-border-strong",
                    )}
                  >
                    <CategoryIcon icon={c.icon} tint={c.tint} size="sm" />
                    <span className="min-w-0 truncate-bn text-sm font-medium text-fg">
                      {c.bnShortName}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.categories && (
              <p className="text-xs text-danger-600">{errors.categories}</p>
            )}
          </fieldset>
        </div>
      )}

      {/* ---------- step 3 ---------- */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2.5 text-sm font-medium text-fg">
              কোন এলাকায় কাজ করেন? <span className="text-danger-600">*</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {AREAS.map((a) => {
                const on = form.areas.includes(a._id);
                return (
                  <button
                    key={a._id}
                    type="button"
                    onClick={() => toggle("areas", a._id)}
                    aria-pressed={on}
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
            {errors.areas && <p className="text-xs text-danger-600">{errors.areas}</p>}
          </fieldset>

          <Field label="সর্বনিম্ন দর (৳)" required error={errors.priceFrom} hint="একটি ভিজিটের ন্যূনতম খরচ">
            {(p) => (
              <Input
                {...p}
                type="number"
                inputMode="numeric"
                min={1}
                value={form.priceFrom}
                onChange={(e) => set("priceFrom", e.target.value)}
                placeholder="৬০০"
                invalid={!!errors.priceFrom}
              />
            )}
          </Field>

          <Field label="কত বছরের অভিজ্ঞতা?" required error={errors.experience}>
            {(p) => (
              <Select value={form.experience} onValueChange={(v) => set("experience", v)}>
                <SelectTrigger
                  id={p.id}
                  aria-describedby={p["aria-describedby"]}
                  invalid={!!errors.experience}
                >
                  <SelectValue placeholder="বেছে নিন" />
                </SelectTrigger>
                <SelectContent>
                  {["১ বছরের কম", "১–৩ বছর", "৩–৫ বছর", "৫–১০ বছর", "১০ বছরের বেশি"].map(
                    (label) => (
                      <SelectItem key={label} value={label}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            )}
          </Field>
        </div>
      )}

      {/* ---------- step 4 ---------- */}
      {step === 3 && (
        <div className="flex flex-col gap-5">
          <p className="rounded-md bg-surface-muted px-4 py-3 text-sm text-fg-secondary">
            যাচাইকৃত পেশাদাররা গড়ে তিনগুণ বেশি কাজের অনুরোধ পান। কাগজপত্র জমা
            দিলে আমরা এক থেকে দুই কর্মদিবসে যাচাই করি।
          </p>

          <div className="flex flex-col gap-1">
            <CheckboxField
              checked={form.nid}
              onCheckedChange={(v) => set("nid", v === true)}
              label="জাতীয় পরিচয়পত্রের ছবি জমা দিয়েছি"
              hint="ডেমোতে শুধু টিক দিলেই হবে"
            />
            {errors.nid && <p className="text-xs text-danger-600">{errors.nid}</p>}
          </div>

          <CheckboxField
            checked={form.photo}
            onCheckedChange={(v) => set("photo", v === true)}
            label="আমার একটি স্পষ্ট ছবি জমা দিয়েছি"
            hint="ঐচ্ছিক, তবে প্রোফাইল বেশি বিশ্বাসযোগ্য হয়"
          />

          <div className="flex flex-col gap-1 border-t border-border-subtle pt-5">
            <CheckboxField
              checked={form.agreed}
              onCheckedChange={(v) => set("agreed", v === true)}
              label="আমি ঘরলির শর্তাবলী ও কমিশন কাঠামোতে সম্মত"
            />
            {errors.agreed && <p className="text-xs text-danger-600">{errors.agreed}</p>}
          </div>
        </div>
      )}

      {/* ---------- nav ---------- */}
      <div className="flex items-center gap-3 border-t border-border-subtle pt-5">
        {step > 0 && (
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft aria-hidden="true" />
            {ACTIONS.back}
          </Button>
        )}
        <div className="ms-auto">
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>{ACTIONS.next}</Button>
          ) : (
            <Button loading={pending} onClick={submit}>
              {ACTIONS.submit}
            </Button>
          )}
        </div>
      </div>

      <p className="text-center text-sm text-fg-secondary">
        আগে থেকেই অ্যাকাউন্ট আছে?{" "}
        <Link
          href="/login?role=provider"
          className="rounded-xs font-medium text-fg-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          {ACTIONS.login}
        </Link>
      </p>
    </div>
  );
}
