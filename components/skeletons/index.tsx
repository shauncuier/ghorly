import { cn } from "@/lib/cn";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

/**
 * Every list surface ships its skeleton in the same commit as the list.
 *
 * These mirror the real components' geometry closely — a skeleton whose shape
 * doesn't match what replaces it produces a visible jump on load, which reads
 * worse than no skeleton at all.
 */

export function ServiceCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-surface p-5",
        className,
      )}
    >
      <Skeleton className="size-11 rounded-lg" />
      <Skeleton className="h-4 w-28" />
      <SkeletonText lines={2} />
      <div className="mt-2 flex items-center justify-between pt-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="size-4" />
      </div>
    </div>
  );
}

export function ProviderCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-border bg-surface p-5",
        className,
      )}
    >
      <div className="flex items-start gap-3.5">
        <Skeleton circle className="size-14 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-full max-w-32" />
          <Skeleton className="h-3.5 w-full max-w-40" />
          <Skeleton className="h-3 w-full max-w-28" />
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
        <Skeleton className="h-5 w-20 shrink-0" />
        <Skeleton className="h-[2.375rem] w-28 shrink-0 rounded-md" />
      </div>
    </div>
  );
}

export function BookingCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex flex-col gap-4 rounded-lg border border-border bg-surface p-5", className)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Skeleton className="size-11 shrink-0 rounded-lg" />
          {/* Flexible rather than fixed: a skeleton that cannot shrink forces
              horizontal scroll at 320px, which the real card never does. */}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-full max-w-36" />
            <Skeleton className="h-3 w-full max-w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
      </div>
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
        <Skeleton className="h-5 w-24 shrink-0" />
        <Skeleton className="h-[2.375rem] w-24 shrink-0 rounded-md" />
      </div>
    </div>
  );
}

export function ReviewSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 py-5", className)}>
      <div className="flex items-center gap-3">
        <Skeleton circle className="size-9 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-3.5 w-full max-w-28" />
          <Skeleton className="h-3 w-full max-w-20" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex flex-col gap-3 rounded-lg border border-border bg-surface p-5", className)}
    >
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BookingCardSkeleton />
        <BookingCardSkeleton />
      </div>
    </div>
  );
}

export function ListSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3.5"
        >
          <Skeleton circle className="size-11 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-full max-w-32" />
            <Skeleton className="h-3 w-full max-w-48" />
          </div>
          <Skeleton className="h-3 w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function ProviderGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProviderCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ServiceGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ServiceCardSkeleton key={i} />
      ))}
    </div>
  );
}
