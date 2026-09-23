import { cn } from "@/lib/cn";

/**
 * Visible to screen readers, invisible on screen. Used for chart data tables,
 * live-region announcements and headings that structure a page without
 * appearing in the design.
 */
export function VisuallyHidden({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return <span className={cn("sr-only", className)} {...props} />;
}
