"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/ui/price-display";
import { toast } from "@/lib/toast";
import { formatDate, formatDuration } from "@/lib/format";
import { shiftDays, TODAY } from "@/lib/data/clock";
import { SLOTS } from "@/lib/strings";
import { CATEGORY_BY_ID } from "@/lib/data/categories";
import { COMMON } from "@/lib/strings";
import type { Provider } from "@/lib/types";

/** Next seven days from the frozen clock — deterministic, no `new Date()`. */
const DAYS = Array.from({ length: 7 }, (_, i) => shiftDays(TODAY, i));

/**
 * Sticky request panel on `/providers/[slug]`.
 *
 * The only interactive island on the profile: the rest of the page is
 * server-rendered for SEO. It requests the *service*, not this professional —
 * the Ghorly team assigns whoever is right for the job — and seeds the wizard
 * with the day and slot so the customer doesn't re-enter them.
 */
export function BookingPanel({ provider }: { provider: Provider }) {
  const router = useRouter();
  const [day, setDay] = useState(DAYS[0]);
  const [slot, setSlot] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function request() {
    if (!slot) {
      toast.warning("একটি সময় বেছে নিন", {
        description: "কখন আসতে হবে জানালে আমাদের টিম দ্রুত পেশাদার ঠিক করতে পারবে।",
      });
      return;
    }
    setPending(true);
    const category = CATEGORY_BY_ID[provider.categoryIds[0]];
    const params = new URLSearchParams({
      ...(category ? { category: category.slug } : {}),
      date: day,
      slot,
    });
    router.push(`/customer/request?${params}`);
  }

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <PriceDisplay amount={provider.priceFrom} showFrom size="lg" />
        <span className="text-xs text-fg-tertiary">
          {formatDuration(provider.responseMinutes)}ে সাড়া
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-sm font-medium text-fg">কোন দিন?</span>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {DAYS.map((d, i) => (
            <button
              key={d}
              type="button"
              onClick={() => setDay(d)}
              aria-pressed={d === day}
              className={cn(
                "flex min-w-14 shrink-0 flex-col items-center gap-0.5 rounded-md border px-2.5 py-2 text-xs",
                "transition-[border-color,background-color,color] duration-(--duration-fast)",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                d === day
                  ? "border-teal-600 bg-teal-600 text-white"
                  : "border-border bg-surface text-fg-secondary hover:border-border-strong",
              )}
            >
              <span>{i === 0 ? COMMON.today : i === 1 ? COMMON.tomorrow : formatDate(d, "medium").split(",")[0]}</span>
              <span className="font-semibold tabular">{formatDate(d, "short").slice(0, 5)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-sm font-medium text-fg">কোন সময়?</span>
        <div className="grid grid-cols-2 gap-1.5">
          {SLOTS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSlot(s.key)}
              aria-pressed={s.key === slot}
              className={cn(
                "rounded-md border px-2.5 py-2 text-xs",
                "transition-[border-color,background-color,color] duration-(--duration-fast)",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                s.key === slot
                  ? "border-teal-600 bg-teal-50 font-medium text-teal-800"
                  : "border-border bg-surface text-fg-secondary hover:border-border-strong",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 border-t border-border-subtle pt-4">
        <Button block loading={pending} onClick={request}>
          <Calendar aria-hidden="true" />
          এই সেবার জন্য অনুরোধ করুন
        </Button>
        <p className="text-center text-xs text-fg-tertiary">
          অনুরোধ পাঠাতে কোনো খরচ নেই। ঘরলি টিম আপনার কাজের জন্য উপযুক্ত পেশাদার ঠিক করে দাম
          জানাবে।
        </p>
      </div>
    </div>
  );
}
