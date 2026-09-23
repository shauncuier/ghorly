import Link from "next/link";
import { Check, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Rating } from "@/components/ui/rating";
import { HeroSearch } from "@/components/marketing/hero-search";
import { VerifiedBadge } from "@/components/domain/verified-badge";
import { CategoryIcon } from "@/components/domain/category-icon";
import { PROVIDER_BY_SLUG } from "@/lib/data/providers";
import { CATEGORY_BY_SLUG } from "@/lib/data/categories";
import { AREA_BY_ID } from "@/lib/data/areas";
import { formatBdt, formatCount, formatDuration } from "@/lib/format";
import { ACTIONS, BRAND, COMMON } from "@/lib/strings";

const TRUST_POINTS = [
  "যাচাইকৃত পেশাদার",
  "স্বচ্ছ দাম",
  "স্থানীয় সেবা",
  "নিরাপদ বুকিং",
];

/**
 * Server component throughout, except for the search combobox island.
 *
 * The "hero visual" is a composition of the product's own UI — a provider
 * card, a category tile, a live-ish booking chip — rather than a stock photo.
 * It shows what the product actually looks like, and it costs no image bytes.
 */
export function Hero() {
  const rahim = PROVIDER_BY_SLUG["rahim-ahmed"];
  const roksana = PROVIDER_BY_SLUG["roksana-begum"];
  const acCategory = CATEGORY_BY_SLUG["ac-repair"];
  const rahimArea = AREA_BY_ID[rahim.areaId];

  return (
    <section className="relative overflow-hidden border-b border-border bg-surface">
      {/* Very restrained background: one soft teal wash, no gradient stack. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_40rem_at_80%_-10%,var(--teal-50),transparent_70%)]"
      />

      <div className="container-page relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* ---------- copy ---------- */}
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-5">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-700">
              <MapPin aria-hidden="true" className="size-3.5" />
              <span className="-translate-y-px">{BRAND.city}-এ চালু হয়েছে</span>
            </span>

            <h1 className="text-4xl font-extrabold text-fg md:text-5xl lg:text-6xl">
              আপনার ঘরের জন্য
              <br />
              <span className="text-teal-700">বিশ্বস্ত সেবা।</span>
            </h1>

            <p className="max-w-xl text-lg text-fg-secondary">
              মেরামত, রক্ষণাবেক্ষণ, পরিষ্কার — ঘরের প্রয়োজনীয় সব কাজের জন্য
              যাচাইকৃত স্থানীয় পেশাদার খুঁজে নিন।
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/services">{ACTIONS.findService}</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/register/provider">{ACTIONS.becomeProfessional}</Link>
            </Button>
          </div>

          <ul className="flex flex-wrap gap-x-6 gap-y-2.5">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2 text-sm text-fg-secondary">
                <Check
                  aria-hidden="true"
                  strokeWidth={2.5}
                  className="size-4 shrink-0 text-teal-600"
                />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* ---------- visual ---------- */}
        <div className="relative lg:pl-6">
          {/* Primary card */}
          <div className="relative z-10 rounded-xl border border-border bg-surface p-5 shadow-xl">
            <div className="flex items-start gap-4">
              <Avatar id={rahim._id} name={rahim.bnName} size="xl" />
              <div className="flex min-w-0 flex-col gap-1">
                <VerifiedBadge />
                <h2 className="text-xl font-bold text-fg">{rahim.bnName}</h2>
                <p className="text-sm text-fg-secondary">{rahim.bnTitle}</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 border-t border-border-subtle pt-4">
              <Rating value={rahim.rating} size="md" />
              <span className="text-sm tabular text-fg-tertiary">
                {formatCount(rahim.completedJobs, "কাজ")}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-sm text-fg-tertiary">
                <MapPin aria-hidden="true" className="size-4" />
                {rahimArea?.bnName}
              </span>
              <span className="text-sm text-fg-tertiary">
                {COMMON.startingFrom}{" "}
                <span className="text-base font-bold tabular text-fg">
                  {formatBdt(rahim.priceFrom)}
                </span>
              </span>
            </div>
          </div>

          {/* Floating: response time. Hidden on small screens where it would collide. */}
          <div className="absolute -left-8 top-28 z-20 hidden items-center gap-2.5 rounded-lg border border-border bg-surface px-3.5 py-2.5 shadow-lg lg:flex lg:-left-6 xl:-left-12">
            <span className="grid size-8 place-items-center rounded-full bg-success-50 text-success-600">
              <Clock aria-hidden="true" className="size-4" />
            </span>
            <span className="text-xs">
              <span className="block font-semibold text-fg">
                {formatDuration(rahim.responseMinutes)}
              </span>
              <span className="text-fg-tertiary">গড়ে সাড়া দেন</span>
            </span>
          </div>

          {/* Floating: category tile */}
          <div className="absolute -right-4 -top-7 z-20 hidden items-center gap-3 rounded-lg border border-border bg-surface px-3.5 py-3 shadow-lg lg:flex lg:-right-2 xl:-right-8">
            <CategoryIcon icon={acCategory.icon} tint={acCategory.tint} size="sm" />
            <span className="text-xs">
              <span className="block font-semibold text-fg">{acCategory.bnShortName}</span>
              <span className="tabular text-fg-tertiary">
                {formatCount(acCategory.providerCount, "পেশাদার")}
              </span>
            </span>
          </div>

          {/* Secondary card, offset behind */}
          <div className="relative z-0 -mt-3 ms-8 hidden items-center gap-3 rounded-xl border border-border bg-surface px-5 pb-4 pt-7 shadow-md sm:flex">
            <Avatar id={roksana._id} name={roksana.bnName} size="md" />
            <div className="flex min-w-0 flex-col">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-fg">
                {roksana.bnName}
                <VerifiedBadge size="sm" showLabel={false} />
              </span>
              <span className="truncate-bn text-xs text-fg-tertiary">{roksana.bnTitle}</span>
            </div>
            <Rating value={roksana.rating} size="sm" compact className="ms-auto shrink-0" />
          </div>
        </div>
      </div>

      {/* search sits across the full width, below both columns */}
      <div className="container-page relative pb-16 md:pb-20">
        <HeroSearch />
      </div>
    </section>
  );
}
