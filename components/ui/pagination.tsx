"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { toBn } from "@/lib/format";
import { ARIA } from "@/lib/strings";

/**
 * Page numbers are Bangla numerals, same as every other number in the product.
 * The ellipsis is a real `…` with `aria-hidden`, and the current page carries
 * `aria-current="page"`.
 */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (pageCount <= 1) return null;

  const pages = pageWindow(page, pageCount);

  return (
    <nav aria-label={ARIA.pagination} className={cn("flex items-center gap-1", className)}>
      <button
        type="button"
        aria-label={ARIA.previousPage}
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className={navButtonClass}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>

      {pages.map((p, i) =>
        p === "gap" ? (
          <span
            key={`gap-${i}`}
            aria-hidden="true"
            className="grid size-9 place-items-center text-fg-disabled"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === page ? "page" : undefined}
            aria-label={`পাতা ${toBn(p)}`}
            onClick={() => onPageChange(p)}
            className={cn(
              "grid size-9 place-items-center rounded-md text-sm tabular transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
              p === page
                ? "bg-ink-950 font-semibold text-white"
                : "text-fg-secondary hover:bg-ink-100 hover:text-fg",
            )}
          >
            <span className="-translate-y-px">{toBn(p)}</span>
          </button>
        ),
      )}

      <button
        type="button"
        aria-label={ARIA.nextPage}
        disabled={page === pageCount}
        onClick={() => onPageChange(page + 1)}
        className={navButtonClass}
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </nav>
  );
}

const navButtonClass = cn(
  "grid size-9 place-items-center rounded-md text-fg-secondary transition-colors",
  "hover:bg-ink-100 hover:text-fg",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
  "disabled:pointer-events-none disabled:opacity-40",
);

/** First, last, and a window around the current page, with gaps elided. */
function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const out: (number | "gap")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);

  if (start > 2) out.push("gap");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < pageCount - 1) out.push("gap");

  out.push(pageCount);
  return out;
}
