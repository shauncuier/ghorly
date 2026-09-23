import { cn } from "@/lib/cn";

export interface SkeletonProps extends React.ComponentProps<"div"> {
  /** Round the block fully — for avatar and dot placeholders. */
  circle?: boolean;
}

/**
 * The shimmer base every skeleton is built from.
 *
 * `prefers-reduced-motion` flattens the animation globally (see globals.css),
 * so the block still reads as a placeholder without moving.
 */
export function Skeleton({ className, circle, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("shimmer", circle ? "rounded-full" : "rounded-md", className)}
      {...props}
    />
  );
}

/** A run of text lines with a short final line, which reads as real copy. */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3.5", i === lines - 1 ? "w-3/5" : "w-full")}
        />
      ))}
    </div>
  );
}
