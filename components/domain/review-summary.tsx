import { cn } from "@/lib/cn";
import { Rating } from "@/components/ui/rating";
import { formatCount, formatRating, toBn } from "@/lib/format";
import { COMMON } from "@/lib/strings";

/**
 * Average plus the five-star histogram.
 *
 * Bars are widths derived from the counts, and each row carries its own
 * accessible label so the distribution is readable without seeing the bars.
 */
export function ReviewSummary({
  rating,
  reviewCount,
  breakdown,
  className,
}: {
  rating: number;
  reviewCount: number;
  /** Counts ordered 5★ → 1★. */
  breakdown: number[];
  className?: string;
}) {
  const total = breakdown.reduce((a, b) => a + b, 0) || 1;

  return (
    <div className={cn("flex flex-col gap-6 sm:flex-row sm:items-center", className)}>
      <div className="flex shrink-0 flex-col items-center gap-1.5 sm:w-40">
        <span className="text-5xl font-extrabold tabular text-fg">
          {formatRating(rating)}
        </span>
        <Rating value={rating} size="md" starsOnly />
        <span className="text-sm tabular text-fg-tertiary">
          {formatCount(reviewCount, COMMON.reviews)}
        </span>
      </div>

      <ul className="flex flex-1 flex-col gap-1.5">
        {breakdown.map((count, i) => {
          const stars = 5 - i;
          const pct = (count / total) * 100;
          return (
            <li key={stars} className="flex items-center gap-3">
              <span className="w-10 shrink-0 text-xs tabular text-fg-tertiary">
                {toBn(stars)} তারা
              </span>
              <span
                className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100"
                role="img"
                aria-label={`${toBn(stars)} তারা — ${formatCount(count, COMMON.reviews)}`}
              >
                <span
                  className="block h-full rounded-full bg-warning-500"
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="w-8 shrink-0 text-end text-xs tabular text-fg-tertiary">
                {toBn(count)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
