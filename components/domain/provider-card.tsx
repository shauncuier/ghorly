import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/avatar";
import { Rating } from "@/components/ui/rating";
import { Button } from "@/components/ui/button";
import { LiveVerifiedBadge } from "@/components/domain/live-verified-badge";
import { PriceDisplay } from "@/components/ui/price-display";
import { AREA_BY_ID } from "@/lib/data/areas";
import { formatCount, formatDuration } from "@/lib/format";
import { ACTIONS, COMMON } from "@/lib/strings";
import type { Provider } from "@/lib/types";

/**
 * The marketplace's primary unit.
 *
 * Everything a homeowner needs to decide is on the face of it: who, verified
 * or not, how good, how many jobs, where, from how much, and how fast they
 * reply. Bangla labels run ~1.4× the width of their English equivalents, so
 * the layout uses `line-clamp` and wrapping rows rather than fixed columns.
 */
export function ProviderCard({
  provider,
  action,
  className,
}: {
  provider: Provider;
  /** Optional control in the top-right corner. */
  action?: React.ReactNode;
  className?: string;
}) {
  const area = AREA_BY_ID[provider.areaId];
  // No favourite button: customers don't pick professionals, the team does.
  const corner = action ?? null;

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-4 rounded-lg border border-border bg-surface p-5",
        "transition-[border-color,box-shadow,transform] duration-(--duration-base) ease-(--ease-standard)",
        "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md",
        "focus-within:-translate-y-0.5 focus-within:shadow-md",
        className,
      )}
    >
      {corner ? <div className="absolute right-4 top-4 z-10">{corner}</div> : null}

      <div className="flex items-start gap-3.5">
        <Avatar id={provider._id} name={provider.bnName} size="lg" />

        <div className="flex min-w-0 flex-col gap-0.5 pr-10">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <h3 className="text-base font-semibold text-fg">
              {/* Whole card is clickable via this overlay link, keeping one tab stop. */}
              <Link
                href={`/providers/${provider.slug}`}
                className="rounded-xs after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              >
                {provider.bnName}
              </Link>
            </h3>
            <LiveVerifiedBadge
              providerId={provider._id}
              fallback={provider.isVerified}
              size="sm"
            />
          </div>
          <p className="clamp-1 text-sm text-fg-secondary">{provider.bnTitle}</p>
          <Rating
            value={provider.rating}
            reviewCount={provider.reviewCount}
            size="sm"
            className="mt-1"
          />
        </div>
      </div>

      <dl className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-fg-tertiary">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">{COMMON.serviceArea}</dt>
          <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
          <dd>{area?.bnName}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">{COMMON.completedJobs}</dt>
          <dd className="tabular">{formatCount(provider.completedJobs, "কাজ সম্পন্ন")}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">{COMMON.responseTime}</dt>
          <Clock aria-hidden="true" className="size-3.5 shrink-0" />
          <dd className="tabular">{formatDuration(provider.responseMinutes)}ে সাড়া</dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
        <PriceDisplay amount={provider.priceFrom} showFrom size="md" />
        {/* Relative so it sits above the overlay link and stays separately clickable. */}
        <Button asChild variant="secondary" size="sm" className="relative z-10">
          <Link href={`/providers/${provider.slug}`}>{ACTIONS.viewProfile}</Link>
        </Button>
      </div>
    </article>
  );
}

/** Horizontal variant for dashboard side-rails and "recommended" rows. */
export function ProviderCardCompact({
  provider,
  className,
}: {
  provider: Provider;
  className?: string;
}) {
  const area = AREA_BY_ID[provider.areaId];

  return (
    <article
      className={cn(
        "relative flex items-center gap-3 rounded-lg border border-border bg-surface p-3.5",
        "transition-[border-color,box-shadow] duration-(--duration-fast)",
        "hover:border-border-strong hover:shadow-sm",
        className,
      )}
    >
      <Avatar id={provider._id} name={provider.bnName} size="md" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate-bn text-sm font-semibold text-fg">
            <Link
              href={`/providers/${provider.slug}`}
              className="rounded-xs after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            >
              {provider.bnName}
            </Link>
          </h3>
          <LiveVerifiedBadge
            providerId={provider._id}
            fallback={provider.isVerified}
            size="sm"
            showLabel={false}
          />
        </div>
        <p className="truncate-bn text-xs text-fg-tertiary">
          {provider.bnTitle} · {area?.bnName}
        </p>
      </div>
      <Rating value={provider.rating} size="sm" compact className="shrink-0" />
    </article>
  );
}
