"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { CategoryGlyph } from "@/components/domain/category-icon";
import { CATEGORIES } from "@/lib/data/categories";
import { AREAS } from "@/lib/data/areas";
import { ACTIONS } from "@/lib/strings";

/**
 * The hero's service search.
 *
 * A real combobox rather than a decorative input: typing filters the 14
 * categories and their sub-services, arrow keys move through results, Enter
 * commits, Escape closes. Selecting a suggestion navigates to that category.
 *
 * Matching is done on the Bangla strings directly — no transliteration — since
 * the product has no English surface at all.
 */

interface Suggestion {
  slug: string;
  label: string;
  /** Present when the match came from a sub-service rather than the category. */
  parent?: string;
  icon: (typeof CATEGORIES)[number]["icon"];
}

const ALL_SUGGESTIONS: Suggestion[] = CATEGORIES.flatMap((c) => [
  { slug: c.slug, label: c.bnName, icon: c.icon },
  ...c.subServices.map((s) => ({
    slug: c.slug,
    label: s,
    parent: c.bnShortName,
    icon: c.icon,
  })),
]);

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [areaSlug, setAreaSlug] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = "hero-search-suggestions";

  const suggestions = useMemo(() => {
    const q = query.trim();
    if (!q) return ALL_SUGGESTIONS.filter((s) => !s.parent).slice(0, 6);
    return ALL_SUGGESTIONS.filter((s) => s.label.includes(q)).slice(0, 7);
  }, [query]);

  function go(slug?: string) {
    const params = new URLSearchParams();
    if (areaSlug) params.set("area", areaSlug);
    const target = slug
      ? `/services/${slug}${params.size ? `?${params}` : ""}`
      : `/services?${new URLSearchParams({
          ...(query.trim() ? { q: query.trim() } : {}),
          ...(areaSlug ? { area: areaSlug } : {}),
        })}`;
    router.push(target);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const picked = activeIndex >= 0 ? suggestions[activeIndex] : undefined;
      setOpen(false);
      go(picked?.slug);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-3 shadow-lg md:p-4">
      <p className="px-1 pb-3 text-sm font-medium text-fg-secondary md:pb-4">
        আপনার কী সাহায্য দরকার?
      </p>

      <div className="flex flex-col gap-2.5 md:flex-row md:items-stretch md:gap-2">
        {/* service combobox */}
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-fg-tertiary"
          />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
            }
            aria-label="সেবা খুঁজুন"
            placeholder="যে সেবা খুঁজছেন লিখুন…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onKeyDown={onKeyDown}
            className="h-13 w-full rounded-md border border-border bg-surface pl-11 pr-3.5 text-base text-fg placeholder:text-fg-disabled hover:border-border-strong focus:border-border-focus focus:shadow-focus focus:outline-none"
          />

          {open && suggestions.length > 0 && (
            <ul
              id={listId}
              role="listbox"
              aria-label="সেবার পরামর্শ"
              className="absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-lg border border-border bg-surface p-1.5 shadow-lg animate-(--animate-scale-in)"
            >
              {suggestions.map((s, i) => (
                <li
                  key={`${s.slug}-${s.label}`}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setOpen(false);
                    go(s.slug);
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 text-sm",
                    i === activeIndex ? "bg-surface-muted text-fg" : "text-fg-secondary",
                  )}
                >
                  <CategoryGlyph icon={s.icon} className="size-4 shrink-0 text-fg-tertiary" />
                  <span className="min-w-0 flex-1 truncate-bn">{s.label}</span>
                  {s.parent && (
                    <span className="shrink-0 text-xs text-fg-disabled">{s.parent}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* area */}
        <div className="relative md:w-52">
          <MapPin
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-fg-tertiary"
          />
          <select
            aria-label="এলাকা বেছে নিন"
            value={areaSlug}
            onChange={(e) => setAreaSlug(e.target.value)}
            className="h-13 w-full appearance-none rounded-md border border-border bg-surface pl-11 pr-8 text-base text-fg hover:border-border-strong focus:border-border-focus focus:shadow-focus focus:outline-none"
          >
            <option value="">চট্টগ্রাম — সব এলাকা</option>
            {AREAS.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.bnName}
              </option>
            ))}
          </select>
        </div>

        <Button size="lg" className="md:px-8" onClick={() => go()}>
          {ACTIONS.findProfessionals}
        </Button>
      </div>
    </div>
  );
}
