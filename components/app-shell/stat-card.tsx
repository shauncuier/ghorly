import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/format";

export interface StatCardProps {
  label: string;
  value: string;
  /** Whole-number percentage change; sign drives the arrow and colour. */
  delta?: number;
  hint?: string;
  icon?: React.ReactNode;
  href?: string;
  tone?: "default" | "accent";
  className?: string;
}

export function StatCard({
  label,
  value,
  delta,
  hint,
  icon,
  href,
  tone = "default",
  className,
}: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm text-fg-tertiary">{label}</span>
        {icon && (
          <span
            aria-hidden="true"
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-lg [&_svg]:size-4.5",
              tone === "accent" ? "bg-teal-50 text-teal-700" : "bg-surface-muted text-fg-tertiary",
            )}
          >
            {icon}
          </span>
        )}
      </div>

      <span className="text-2xl font-extrabold tabular text-fg md:text-3xl">{value}</span>

      <div className="flex items-center gap-2">
        {/* A trend beside a zero value reads as a bug, so suppress it. */}
        {delta !== undefined && value !== "৳০" && value !== "০" && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium tabular",
              delta >= 0 ? "text-success-700" : "text-danger-600",
            )}
          >
            {delta >= 0 ? (
              <TrendingUp aria-hidden="true" className="size-3.5" />
            ) : (
              <TrendingDown aria-hidden="true" className="size-3.5" />
            )}
            {formatPercent(Math.abs(delta), false)}
          </span>
        )}
        {hint && <span className="text-xs text-fg-tertiary">{hint}</span>}
      </div>
    </>
  );

  const classes = cn(
    "flex flex-col gap-2 rounded-lg border border-border bg-surface p-5",
    href &&
      "transition-[border-color,box-shadow,transform] duration-(--duration-base) hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {body}
      </Link>
    );
  }

  return <div className={classes}>{body}</div>;
}
