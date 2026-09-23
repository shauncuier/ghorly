import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import { CategoryIcon } from "@/components/domain/category-icon";
import { formatBdt } from "@/lib/format";
import { COMMON } from "@/lib/strings";
import type { Category } from "@/lib/types";

/**
 * Service discovery tile.
 *
 * Kept compact on purpose — the brief calls out oversized cards as a thing to
 * avoid, and a dense grid reads as a real catalogue rather than a brochure.
 *
 * The arrow points left because it is a *forward* affordance whose direction
 * follows the reading order of the sentence beside it; Bangla is LTR, so it is
 * rotated to point right on render. Keeping one icon and rotating it means the
 * hover translation stays consistent with the rest of the system.
 */
export function ServiceCard({
  category,
  className,
}: {
  category: Category;
  className?: string;
}) {
  return (
    <Link
      href={`/services/${category.slug}`}
      className={cn(
        "group flex flex-col gap-3 rounded-lg border border-border bg-surface p-5",
        "transition-[border-color,box-shadow,transform] duration-(--duration-base) ease-(--ease-standard)",
        "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
        className,
      )}
    >
      <CategoryIcon
        icon={category.icon}
        tint={category.tint}
        size="md"
        className="transition-transform duration-(--duration-base) ease-(--ease-out-quint) group-hover:-translate-y-0.5"
      />

      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-fg">{category.bnShortName}</h3>
        <p className="clamp-2 text-sm text-fg-secondary">
          {category.bnDescription}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-2">
        <span className="text-xs text-fg-tertiary">
          {COMMON.startingFrom}{" "}
          <span className="font-semibold tabular text-fg">
            {formatBdt(category.priceFrom)}
          </span>
        </span>
        <ArrowLeft
          aria-hidden="true"
          className="size-4 rotate-180 text-fg-disabled transition-[transform,color] duration-(--duration-base) ease-(--ease-out-quint) group-hover:translate-x-0.5 group-hover:text-fg-accent"
        />
      </div>
    </Link>
  );
}

/** Dense variant used in the customer dashboard's "জনপ্রিয় সেবা" row. */
export function ServiceChipCard({
  category,
  href,
  className,
}: {
  category: Category;
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href ?? `/customer/request?category=${category.slug}`}
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-border bg-surface p-3",
        "transition-[border-color,box-shadow] duration-(--duration-fast)",
        "hover:border-border-strong hover:shadow-sm",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
        className,
      )}
    >
      <CategoryIcon icon={category.icon} tint={category.tint} size="sm" />
      <span className="min-w-0 flex-1 truncate-bn text-sm font-medium text-fg">
        {category.bnShortName}
      </span>
    </Link>
  );
}
