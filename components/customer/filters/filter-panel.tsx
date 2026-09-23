"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { CategoryGlyph } from "@/components/domain/category-icon";
import { useAreas, useCategories } from "@/lib/api/queries";
import { formatBdt, formatRating, toBn } from "@/lib/format";
import { ACTIONS } from "@/lib/strings";

export interface Filters {
  categoryId: string | null;
  areaId: string | null;
  minRating: number;
  maxPrice: number;
  verifiedOnly: boolean;
}

export const DEFAULT_FILTERS: Filters = {
  categoryId: null,
  areaId: null,
  minRating: 0,
  maxPrice: 6000,
  verifiedOnly: false,
};

export const PRICE_CEILING = 6000;

const RATINGS = [0, 3.5, 4, 4.5] as const;

/**
 * Shared by the desktop sidebar and the mobile filter sheet, so the two can
 * never drift apart.
 */
export function FilterPanel({
  filters,
  onChange,
  onReset,
}: {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
}) {
  const { data: categories } = useCategories();
  const { data: areas } = useAreas();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-fg">{ACTIONS.filter}</h2>
        <Button variant="ghost" size="sm" onClick={onReset}>
          {ACTIONS.clearFilters}
        </Button>
      </div>

      {/* category */}
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 text-sm font-medium text-fg">সেবার ধরন</legend>
        <div className="flex flex-col gap-1">
          {(categories ?? []).map((c) => {
            const on = filters.categoryId === c._id;
            return (
              <button
                key={c._id}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ categoryId: on ? null : c._id })}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-start text-sm",
                  "transition-colors duration-(--duration-fast)",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                  on
                    ? "bg-teal-50 font-medium text-teal-800"
                    : "text-fg-secondary hover:bg-ink-100 hover:text-fg",
                )}
              >
                <CategoryGlyph icon={c.icon} className="size-4 shrink-0" />
                <span className="min-w-0 truncate-bn">{c.bnShortName}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <Separator />

      {/* area */}
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 text-sm font-medium text-fg">এলাকা</legend>
        <div className="flex flex-wrap gap-1.5">
          {(areas ?? []).map((a) => {
            const on = filters.areaId === a._id;
            return (
              <button
                key={a._id}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ areaId: on ? null : a._id })}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium",
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

      <Separator />

      {/* rating */}
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 text-sm font-medium text-fg">ন্যূনতম রেটিং</legend>
        <div className="flex flex-wrap gap-1.5">
          {RATINGS.map((r) => {
            const on = filters.minRating === r;
            return (
              <button
                key={r}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ minRating: r })}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                  "transition-[border-color,background-color,color] duration-(--duration-fast)",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                  on
                    ? "border-teal-600 bg-teal-600 text-white"
                    : "border-border bg-surface text-fg-secondary hover:border-border-strong",
                )}
              >
                {r === 0 ? (
                  <span className="-translate-y-px">সব</span>
                ) : (
                  <>
                    <Star aria-hidden="true" className="size-3 fill-current" />
                    <span className="-translate-y-px tabular">{formatRating(r)}+</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Separator />

      {/* price */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-fg">সর্বোচ্চ শুরুর দাম</legend>
        <Slider
          value={[filters.maxPrice]}
          min={500}
          max={PRICE_CEILING}
          step={100}
          ariaLabels={["সর্বোচ্চ দাম"]}
          onValueChange={([v]) => onChange({ maxPrice: v })}
        />
        <div className="flex items-baseline justify-between text-xs text-fg-tertiary">
          <span className="tabular">{formatBdt(500)}</span>
          <span className="font-semibold tabular text-fg">
            {filters.maxPrice >= PRICE_CEILING
              ? `${formatBdt(PRICE_CEILING)}+`
              : formatBdt(filters.maxPrice)}
          </span>
          <span className="tabular">{formatBdt(PRICE_CEILING)}+</span>
        </div>
      </fieldset>

      <Separator />

      <CheckboxField
        checked={filters.verifiedOnly}
        onCheckedChange={(v) => onChange({ verifiedOnly: v === true })}
        label="শুধু যাচাইকৃত পেশাদার"
        hint="যাঁদের পরিচয় আমরা যাচাই করেছি"
      />
    </div>
  );
}

/** Removable chips summarising what is currently filtered. */
export function ActiveFilters({
  filters,
  onChange,
  categoryLabel,
  areaLabel,
}: {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  categoryLabel?: string;
  areaLabel?: string;
}) {
  const chips: { key: string; label: string; clear: () => void }[] = [];

  if (filters.categoryId && categoryLabel)
    chips.push({
      key: "category",
      label: categoryLabel,
      clear: () => onChange({ categoryId: null }),
    });
  if (filters.areaId && areaLabel)
    chips.push({ key: "area", label: areaLabel, clear: () => onChange({ areaId: null }) });
  if (filters.minRating > 0)
    chips.push({
      key: "rating",
      label: `${formatRating(filters.minRating)}+ রেটিং`,
      clear: () => onChange({ minRating: 0 }),
    });
  if (filters.maxPrice < PRICE_CEILING)
    chips.push({
      key: "price",
      label: `${formatBdt(filters.maxPrice)} পর্যন্ত`,
      clear: () => onChange({ maxPrice: PRICE_CEILING }),
    });
  if (filters.verifiedOnly)
    chips.push({
      key: "verified",
      label: "যাচাইকৃত",
      clear: () => onChange({ verifiedOnly: false }),
    });

  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <li key={chip.key}>
          <button
            type="button"
            onClick={chip.clear}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-fg-secondary transition-colors hover:border-border-strong hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          >
            <span className="-translate-y-px">{chip.label}</span>
            <span aria-hidden="true" className="text-fg-disabled">
              ✕
            </span>
            <span className="sr-only">ফিল্টার সরান</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export { toBn };
