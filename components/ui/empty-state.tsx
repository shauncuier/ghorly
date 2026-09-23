import Link from "next/link";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  title: string;
  body: string;
  /** Decorative mark. Pass a lucide icon; it gets a tinted tile automatically. */
  icon?: React.ReactNode;
  cta?: string;
  href?: string;
  onAction?: () => void;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Every list surface in the app ships one of these in the same commit as the
 * list itself — otherwise the demo shows blank rectangles, which is the most
 * common way a prototype reads as unfinished.
 */
export function EmptyState({
  title,
  body,
  icon,
  cta,
  href,
  onAction,
  size = "md",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        size === "md" ? "px-6 py-16" : "px-4 py-10",
        className,
      )}
    >
      {icon && (
        <span
          aria-hidden="true"
          className={cn(
            "mb-1 grid place-items-center rounded-xl bg-surface-muted text-fg-tertiary",
            size === "md" ? "size-14 [&_svg]:size-6" : "size-11 [&_svg]:size-5",
          )}
        >
          {icon}
        </span>
      )}

      <h3 className={cn("font-semibold text-fg", size === "md" ? "text-lg" : "text-base")}>
        {title}
      </h3>
      <p className="max-w-sm text-sm text-fg-secondary">{body}</p>

      {cta && href && (
        <Button asChild size="sm" className="mt-2">
          <Link href={href}>{cta}</Link>
        </Button>
      )}
      {cta && !href && onAction && (
        <Button size="sm" className="mt-2" onClick={onAction}>
          {cta}
        </Button>
      )}
    </div>
  );
}
