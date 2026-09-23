import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/avatar";
import { Rating } from "@/components/ui/rating";
import { RelativeTime } from "@/components/ui/relative-time";
import { AREA_BY_ID } from "@/lib/data/areas";
import { CATEGORY_BY_ID } from "@/lib/data/categories";
import type { Review, Testimonial } from "@/lib/types";

export function ReviewCard({
  review,
  authorName,
  className,
}: {
  review: Review;
  authorName: string;
  className?: string;
}) {
  const category = CATEGORY_BY_ID[review.categoryId];

  return (
    <article
      className={cn("flex flex-col gap-3 border-b border-border-subtle py-5 last:border-0", className)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar id={review.customerId} name={authorName} size="sm" />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-fg">{authorName}</p>
            <p className="text-xs text-fg-tertiary">
              {category?.bnShortName} · <RelativeTime value={review.createdAt} />
            </p>
          </div>
        </div>
        <Rating value={review.rating} size="sm" starsOnly className="shrink-0" />
      </div>

      <p className="text-sm text-fg-secondary">{review.bnBody}</p>

      {review.bnProviderReply && (
        <div className="rounded-md border-s-2 border-teal-300 bg-surface-muted px-4 py-3">
          <p className="mb-1 text-xs font-medium text-fg-tertiary">পেশাদারের উত্তর</p>
          <p className="text-sm text-fg-secondary">{review.bnProviderReply}</p>
        </div>
      )}
    </article>
  );
}

/** Landing-page testimonial. Quieter chrome, longer measure. */
export function TestimonialCard({
  testimonial,
  className,
}: {
  testimonial: Testimonial;
  className?: string;
}) {
  const area = AREA_BY_ID[testimonial.areaId];
  const category = CATEGORY_BY_ID[testimonial.categoryId];

  return (
    <figure
      className={cn(
        "flex h-full flex-col gap-4 rounded-lg border border-border bg-surface p-6",
        className,
      )}
    >
      <Rating value={testimonial.rating} size="sm" starsOnly />

      <blockquote className="flex-1 text-base text-fg">
        <p>{testimonial.bnBody}</p>
      </blockquote>

      <figcaption className="flex items-center gap-3 border-t border-border-subtle pt-4">
        <Avatar id={testimonial._id} name={testimonial.bnName} size="sm" />
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-medium text-fg">{testimonial.bnName}</span>
          <span className="truncate-bn text-xs text-fg-tertiary">
            {area?.bnName} · {category?.bnShortName}
          </span>
        </div>
      </figcaption>
    </figure>
  );
}
