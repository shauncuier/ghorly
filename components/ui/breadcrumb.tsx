import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import { ARIA } from "@/lib/strings";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Bangla is left-to-right, so the separator points right-to-left visually the
 * same way it would in English — but we use a chevron rather than a slash
 * because a slash next to Bangla digits reads as a date.
 */
export function Breadcrumb({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <nav aria-label={ARIA.breadcrumb} className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && (
                <ChevronLeft
                  aria-hidden="true"
                  className="size-3.5 rotate-180 text-fg-disabled"
                />
              )}
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="rounded-xs text-fg-tertiary transition-colors hover:text-fg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={cn(last ? "font-medium text-fg" : "text-fg-tertiary")}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
