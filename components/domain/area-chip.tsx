import Link from "next/link";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCount } from "@/lib/format";
import type { Area } from "@/lib/types";

export function AreaChip({
  area,
  href,
  showCount = false,
  className,
}: {
  area: Area;
  href?: string;
  showCount?: boolean;
  className?: string;
}) {
  const content = (
    <>
      <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-fg-tertiary" />
      <span className="-translate-y-px">{area.bnName}</span>
      {showCount && (
        <span className="tabular text-xs text-fg-tertiary">
          {formatCount(area.providerCount)}
        </span>
      )}
    </>
  );

  const classes = cn(
    "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-fg",
    "transition-[border-color,background-color] duration-(--duration-fast)",
    className,
  );

  if (!href) {
    return <span className={classes}>{content}</span>;
  }

  return (
    <Link
      href={href}
      className={cn(
        classes,
        "hover:border-teal-300 hover:bg-teal-50",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
      )}
    >
      {content}
    </Link>
  );
}
