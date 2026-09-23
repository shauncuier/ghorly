import { cn } from "@/lib/cn";
import { formatBdt, formatBdtRange } from "@/lib/format";
import { COMMON } from "@/lib/strings";

const SIZES = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl",
} as const;

export interface PriceDisplayProps {
  amount: number;
  /** Renders a range: `৳৮০০ – ৳১,৫০০`. */
  to?: number;
  size?: keyof typeof SIZES;
  /** Prefix with "শুরু" for starting prices on provider cards. */
  showFrom?: boolean;
  /** Suffix with "প্রতি ভিজিট". */
  perVisit?: boolean;
  compact?: boolean;
  className?: string;
}

export function PriceDisplay({
  amount,
  to,
  size = "md",
  showFrom = false,
  perVisit = false,
  compact = false,
  className,
}: PriceDisplayProps) {
  const value =
    to === undefined
      ? formatBdt(amount, { compact })
      : formatBdtRange(amount, to, { compact });

  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      {showFrom && (
        <span className="text-xs font-normal text-fg-tertiary">{COMMON.startingFrom}</span>
      )}
      <span className={cn("font-semibold tabular text-fg", SIZES[size])}>{value}</span>
      {perVisit && (
        <span className="text-xs font-normal text-fg-tertiary">{COMMON.perVisit}</span>
      )}
    </span>
  );
}
