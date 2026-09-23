import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { COMMON } from "@/lib/strings";

/**
 * Always icon + the word "যাচাইকৃত", never a bare coloured dot.
 *
 * The brand teal and the success green sit close in hue, so colour alone
 * cannot carry this meaning (WCAG 1.4.1). The label is the signal; the colour
 * is reinforcement.
 */
export function VerifiedBadge({
  size = "md",
  showLabel = true,
  className,
}: {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium text-success-700",
        size === "sm" && "text-xs",
        size === "md" && "text-xs",
        size === "lg" && "text-sm",
        className,
      )}
    >
      <BadgeCheck
        aria-hidden="true"
        strokeWidth={2}
        className={cn("shrink-0", size === "lg" ? "size-4.5" : "size-4")}
      />
      {showLabel ? (
        <span className="-translate-y-px">{COMMON.verified}</span>
      ) : (
        <span className="sr-only">{COMMON.verifiedProfessional}</span>
      )}
    </span>
  );
}
