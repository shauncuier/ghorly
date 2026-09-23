"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/marketing/section";
import { AREAS, HEADLINE_AREAS } from "@/lib/data/areas";
import { formatCount } from "@/lib/format";

/**
 * Stylized Chattogram, not a real map.
 *
 * A Leaflet or Google embed would mean an API key, ~150 KB of client JS, an
 * imperatively-mutated DOM that fights hydration, and English map tiles inside
 * a product that is otherwise entirely Bangla — and it would look like every
 * other local directory.
 *
 * The important implementation detail: the SVG is decorative and `aria-hidden`.
 * The hotspots are real HTML `<button>`s absolutely positioned over it using
 * percentage coordinates from `lib/data/areas.ts`, so they get native focus
 * rings, native keyboard order and real Bangla labels — none of which an
 * in-SVG `<circle>` would give. Below `md` the silhouette hides and the very
 * same buttons reflow into a chip grid.
 */
export function ChattogramMap() {
  const [activeSlug, setActiveSlug] = useState(HEADLINE_AREAS[0].slug);
  const active = AREAS.find((a) => a.slug === activeSlug) ?? HEADLINE_AREAS[0];

  return (
    <Section tone="muted" id="locations">
      <div className="container-page flex flex-col gap-10">
        <SectionHeader
          eyebrow="এলাকাসমূহ"
          title="আপনার এলাকায় ঘরের সেবা"
          description="চট্টগ্রামের প্রতিটি পাড়ায় যাচাইকৃত পেশাদার — কাছেই।"
        />

        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          {/* ---------- map ---------- */}
          <div className="relative hidden aspect-4/3 w-full rounded-xl border border-border bg-surface p-4 md:block">
            <svg
              viewBox="0 0 100 75"
              aria-hidden="true"
              className="size-full"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* city silhouette, heavily simplified */}
              <path
                d="M14 18 L30 9 L48 7 L63 10 L74 16 L82 27 L86 40 L83 54 L74 66 L58 71 L40 70 L26 63 L16 50 L11 34 Z"
                fill="var(--ink-50)"
                stroke="var(--border)"
                strokeWidth="0.6"
                strokeLinejoin="round"
              />
              {/* the Karnaphuli, one stroked path along the south-east edge */}
              <path
                d="M22 68 C36 62, 48 60, 60 56 C70 52, 78 46, 92 38"
                fill="none"
                stroke="var(--teal-200)"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              {/* two arterial roads, for orientation only */}
              <path
                d="M24 22 L52 34 L78 30"
                fill="none"
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeDasharray="1.6 1.6"
              />
              <path
                d="M20 48 L45 40 L68 52"
                fill="none"
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeDasharray="1.6 1.6"
              />
            </svg>

            {/* Real buttons, positioned over the decorative SVG. */}
            {AREAS.map((area) => {
              const isActive = area.slug === activeSlug;
              return (
                <button
                  key={area._id}
                  type="button"
                  onClick={() => setActiveSlug(area.slug)}
                  aria-pressed={isActive}
                  style={{ left: `${area.mapX}%`, top: `${area.mapY}%` }}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
                    "transition-[background-color,border-color,color,box-shadow] duration-(--duration-fast)",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                    isActive
                      ? "z-10 border-teal-600 bg-teal-600 text-white shadow-md"
                      : "border-border bg-surface text-fg-secondary hover:border-teal-300 hover:text-fg",
                  )}
                >
                  <span className="-translate-y-px">{area.bnName}</span>
                </button>
              );
            })}
          </div>

          {/* ---------- mobile chips + detail panel ---------- */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2 md:hidden">
              {AREAS.map((area) => {
                const isActive = area.slug === activeSlug;
                return (
                  <button
                    key={area._id}
                    type="button"
                    onClick={() => setActiveSlug(area.slug)}
                    aria-pressed={isActive}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium",
                      "transition-[background-color,border-color,color] duration-(--duration-fast)",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                      isActive
                        ? "border-teal-600 bg-teal-600 text-white"
                        : "border-border bg-surface text-fg-secondary",
                    )}
                  >
                    <span className="-translate-y-px">{area.bnName}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-6">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700">
                  <MapPin aria-hidden="true" className="size-5" />
                </span>
                <div className="flex flex-col gap-1">
                  {/* Announced politely so keyboard users hear the selection change. */}
                  <h3 className="text-xl font-bold text-fg" aria-live="polite">
                    {active.bnName}
                  </h3>
                  <p className="text-sm tabular text-fg-secondary">
                    {formatCount(active.providerCount, "যাচাইকৃত পেশাদার")}
                  </p>
                </div>
              </div>

              <p className="text-base text-fg-secondary">
                {active.bnName} ও আশেপাশের এলাকায় প্লাম্বিং, ইলেকট্রিক্যাল, এসি ও
                পরিষ্কারের কাজে দক্ষ পেশাদাররা আছেন।
              </p>

              <Button asChild className="w-fit">
                <Link href={`/services?area=${active.slug}`}>
                  {active.bnName}-এর সেবা দেখুন
                  <ArrowLeft aria-hidden="true" className="rotate-180" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
