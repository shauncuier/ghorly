import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/marketing/section";
import { CategoryIcon } from "@/components/domain/category-icon";
import { POPULAR_CATEGORIES } from "@/lib/data/categories";
import { toBn } from "@/lib/format";
import { ACTIONS } from "@/lib/strings";

const POINTS = [
  "একবার লিখুন, একাধিক কোটেশন পান",
  "দাম আগেই জেনে নিন",
  "পছন্দ না হলে বুক করতে হবে না",
];

/**
 * The conversion section. The visual is a miniature of the actual request
 * flow, so the CTA shows the thing it is asking you to do.
 */
export function RequestCta() {
  const preview = POPULAR_CATEGORIES.slice(0, 6);

  return (
    <Section tone="muted">
      <div className="container-page">
        <div className="grid items-center gap-10 rounded-2xl border border-border bg-surface p-8 md:p-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h2 className="text-3xl font-bold text-fg md:text-4xl">
                কিছু একটা ঠিক করাতে হবে?
              </h2>
              <p className="text-lg text-fg-secondary">
                সমস্যাটা কী, শুধু সেটুকু বলুন। উপযুক্ত পেশাদার খুঁজে দেওয়ার কাজটা
                আমাদের।
              </p>
            </div>

            <ul className="flex flex-col gap-2.5">
              {POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-base text-fg-secondary">
                  <Check
                    aria-hidden="true"
                    strokeWidth={2.5}
                    className="mt-1 size-4 shrink-0 text-teal-600"
                  />
                  {point}
                </li>
              ))}
            </ul>

            <Button asChild size="lg" className="w-fit">
              <Link href="/customer/request">
                {ACTIONS.requestService}
                <ArrowLeft aria-hidden="true" className="rotate-180" />
              </Link>
            </Button>
          </div>

          {/* Miniature of step 1 of the wizard. */}
          <div className="rounded-xl border border-border bg-surface-muted p-5 md:p-6">
            <p className="mb-1 text-sm font-medium text-fg-tertiary">
              {toBn(1)}ম ধাপ · {toBn(6)}টির মধ্যে
            </p>
            <p className="mb-5 text-lg font-semibold text-fg">
              আপনার কোন সেবাটি দরকার?
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {preview.map((category, i) => (
                <div
                  key={category._id}
                  className={
                    i === 0
                      ? "flex items-center gap-2.5 rounded-lg border border-teal-600 bg-teal-50/70 p-3 shadow-focus"
                      : "flex items-center gap-2.5 rounded-lg border border-border bg-surface p-3"
                  }
                >
                  <CategoryIcon icon={category.icon} tint={category.tint} size="sm" />
                  <span className="min-w-0 truncate-bn text-sm font-medium text-fg">
                    {category.bnShortName}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
              <div className="h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-ink-200">
                <div className="h-full w-1/6 rounded-full bg-teal-600" />
              </div>
              <span className="shrink-0 rounded-md bg-ink-950 px-4 py-2 text-sm font-medium text-white">
                {ACTIONS.next}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
