"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { List, MapPin, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  Drawer,
  DrawerContent,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProviderCard } from "@/components/domain/provider-card";
import { ProviderGridSkeleton } from "@/components/skeletons";
import {
  ActiveFilters,
  DEFAULT_FILTERS,
  FilterPanel,
  PRICE_CEILING,
  type Filters,
} from "@/components/customer/filters/filter-panel";
import { ResultsMap } from "@/components/customer/results-map";
import { useAreas, useCategories, useProviders } from "@/lib/api/queries";
import { formatCount } from "@/lib/format";
import { ACTIONS, EMPTY } from "@/lib/strings";

const SORTS = [
  { value: "rating", label: "রেটিং অনুযায়ী" },
  { value: "price", label: "কম দাম আগে" },
  { value: "jobs", label: "বেশি কাজ আগে" },
  { value: "response", label: "দ্রুত সাড়া আগে" },
] as const;

/**
 * The customer-side marketplace.
 *
 * Reads its initial category/area from the query string (the landing hero and
 * the area pages both link in with them), then keeps filter state locally.
 * Because it calls `useSearchParams`, the route wraps it in `<Suspense>`.
 */
export function ServicesView() {
  const params = useSearchParams();
  const { data: categories } = useCategories();
  const { data: areas } = useAreas();

  const initialCategory =
    (categories ?? []).find((c) => c.slug === params.get("category"))?._id ?? null;
  const initialArea = (areas ?? []).find((a) => a.slug === params.get("area"))?._id ?? null;

  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    categoryId: initialCategory,
    areaId: initialArea,
  });
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState<(typeof SORTS)[number]["value"]>("rating");
  const [view, setView] = useState("list");
  const [sheetOpen, setSheetOpen] = useState(false);

  const {
    data: providers,
    isLoading,
    error,
    refetch,
  } = useProviders({
    categoryId: filters.categoryId,
    areaId: filters.areaId,
    minRating: filters.minRating || undefined,
    maxPrice: filters.maxPrice < PRICE_CEILING ? filters.maxPrice : undefined,
    verifiedOnly: filters.verifiedOnly,
    query,
    sort,
  });

  const categoryLabel = useMemo(
    () => (categories ?? []).find((c) => c._id === filters.categoryId)?.bnShortName,
    [categories, filters.categoryId],
  );
  const areaLabel = useMemo(
    () => (areas ?? []).find((a) => a._id === filters.areaId)?.bnName,
    [areas, filters.areaId],
  );

  function patch(next: Partial<Filters>) {
    setFilters((f) => ({ ...f, ...next }));
  }

  function reset() {
    setFilters(DEFAULT_FILTERS);
    setQuery("");
  }

  const results = providers ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold text-fg md:text-3xl">সেবা খুঁজুন</h1>
        <p className="text-base text-fg-secondary">
          চট্টগ্রামের যাচাইকৃত পেশাদারদের মধ্য থেকে বেছে নিন।
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr] lg:gap-10">
        {/* ---------- desktop filters ---------- */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-lg border border-border bg-surface p-5">
            <FilterPanel filters={filters} onChange={patch} onReset={reset} />
          </div>
        </aside>

        {/* ---------- results ---------- */}
        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-col gap-3">
            <SearchInput
              value={query}
              onValueChange={setQuery}
              placeholder="পেশাদারের নাম বা কাজ খুঁজুন…"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm tabular text-fg-secondary" aria-live="polite">
                {isLoading ? "খোঁজা হচ্ছে…" : formatCount(results.length, "পেশাদার পাওয়া গেছে")}
              </p>

              <div className="flex items-center gap-2">
                {/* mobile filter sheet */}
                <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="secondary" size="sm" className="lg:hidden">
                      <SlidersHorizontal aria-hidden="true" />
                      {ACTIONS.filter}
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent side="bottom" className="max-h-[85vh]">
                    <DrawerHeader>
                      <DrawerTitle>{ACTIONS.filter}</DrawerTitle>
                    </DrawerHeader>
                    <DrawerBody>
                      <FilterPanel filters={filters} onChange={patch} onReset={reset} />
                    </DrawerBody>
                    <DrawerFooter>
                      <Button block onClick={() => setSheetOpen(false)}>
                        {formatCount(results.length, "ফলাফল")} দেখুন
                      </Button>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>

                <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                  <SelectTrigger size="sm" className="w-44" aria-label="সাজান">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORTS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <SegmentedControl
                  ariaLabel="দেখার ধরন"
                  value={view}
                  onValueChange={setView}
                  size="sm"
                  options={[
                    { value: "list", label: "তালিকা", icon: <List /> },
                    { value: "map", label: "মানচিত্র", icon: <MapPin /> },
                  ]}
                />
              </div>
            </div>

            <ActiveFilters
              filters={filters}
              onChange={patch}
              categoryLabel={categoryLabel}
              areaLabel={areaLabel}
            />
          </div>

          {/* The three states of the query envelope — all real code paths. */}
          {error ? (
            <ErrorState onRetry={refetch} />
          ) : isLoading ? (
            <ProviderGridSkeleton count={6} />
          ) : results.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface">
              <EmptyState {...EMPTY.searchResults} onAction={reset} />
            </div>
          ) : view === "map" ? (
            <ResultsMap providers={results} activeAreaId={filters.areaId} onAreaSelect={(areaId) => patch({ areaId })} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {results.map((provider) => (
                <ProviderCard key={provider._id} provider={provider} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
