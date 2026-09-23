import { cn } from "@/lib/cn";
import { formatCount, formatRating } from "@/lib/format";
import { COMMON } from "@/lib/strings";

const SIZES = {
  sm: { star: 12, gap: 1.5, text: "text-xs" },
  md: { star: 14, gap: 2, text: "text-sm" },
  lg: { star: 18, gap: 2.5, text: "text-base" },
} as const;

const STAR_PATH =
  "M12 2.6l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.42l-5.8 3.05 1.1-6.46-4.69-4.58 6.49-.94L12 2.6z";

/**
 * Star rating with a true partial fill.
 *
 * The fill is a clipped overlay rather than a rounded-to-half approximation,
 * so ৪.৯ actually looks like ৪.৯ — rounding every rating to a half star is a
 * small thing that makes a marketplace feel fake.
 */
export interface RatingProps {
  value: number;
  reviewCount?: number;
  size?: keyof typeof SIZES;
  /** Hide the numeric value and show stars only. */
  starsOnly?: boolean;
  /** Show a single star plus the number, instead of five stars. Used in dense cards. */
  compact?: boolean;
  className?: string;
}

export function Rating({
  value,
  reviewCount,
  size = "md",
  starsOnly = false,
  compact = false,
  className,
}: RatingProps) {
  const { star, text } = SIZES[size];
  const percent = Math.max(0, Math.min(100, (value / 5) * 100));

  const label =
    reviewCount === undefined
      ? `৫-এ ${formatRating(value)} রেটিং`
      : `৫-এ ${formatRating(value)} রেটিং, ${formatCount(reviewCount, COMMON.reviews)}`;

  if (compact) {
    return (
      <span className={cn("inline-flex items-center gap-1", text, className)}>
        <svg
          width={star}
          height={star}
          viewBox="0 0 24 24"
          className="shrink-0 text-warning-500"
          aria-hidden="true"
        >
          <path d={STAR_PATH} fill="currentColor" />
        </svg>
        <span className="font-semibold tabular text-fg">{formatRating(value)}</span>
        {reviewCount !== undefined && (
          <span className="tabular text-fg-tertiary">
            ({formatCount(reviewCount)})
          </span>
        )}
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2", text, className)}>
      <span className="relative inline-flex shrink-0" aria-hidden="true">
        {/* empty track */}
        <span className="inline-flex gap-0.5 text-ink-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} width={star} height={star} viewBox="0 0 24 24">
              <path d={STAR_PATH} fill="currentColor" />
            </svg>
          ))}
        </span>
        {/* filled overlay, clipped to the exact value */}
        <span
          className="absolute inset-0 inline-flex gap-0.5 overflow-hidden text-warning-500"
          style={{ width: `${percent}%` }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              width={star}
              height={star}
              viewBox="0 0 24 24"
              className="shrink-0"
            >
              <path d={STAR_PATH} fill="currentColor" />
            </svg>
          ))}
        </span>
      </span>

      {!starsOnly && (
        <span className="font-semibold tabular text-fg">{formatRating(value)}</span>
      )}
      {!starsOnly && reviewCount !== undefined && (
        <span className="tabular text-fg-tertiary">
          ({formatCount(reviewCount)})
        </span>
      )}
      <span className="sr-only">{label}</span>
    </span>
  );
}
