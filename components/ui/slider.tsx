"use client";

import { Slider as RadixSlider } from "radix-ui";
import { cn } from "@/lib/cn";

/**
 * Used for the price-range filter. Both thumbs get an accessible Bangla label
 * via `ariaLabels`, because "Minimum"/"Maximum" from a default would be the
 * only English a screen-reader user hears.
 */
export function Slider({
  className,
  ariaLabels,
  ...props
}: React.ComponentProps<typeof RadixSlider.Root> & {
  ariaLabels?: string[];
}) {
  const thumbCount = props.value?.length ?? props.defaultValue?.length ?? 1;

  return (
    <RadixSlider.Root
      className={cn(
        "relative flex w-full touch-none select-none items-center py-2",
        className,
      )}
      {...props}
    >
      <RadixSlider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-ink-100">
        <RadixSlider.Range className="absolute h-full bg-teal-600" />
      </RadixSlider.Track>
      {Array.from({ length: thumbCount }).map((_, i) => (
        <RadixSlider.Thumb
          key={i}
          aria-label={ariaLabels?.[i]}
          className={cn(
            "block size-5 rounded-full border-2 border-teal-600 bg-surface shadow-sm",
            "transition-[box-shadow] duration-(--duration-fast)",
            "hover:shadow-focus",
            "focus-visible:shadow-focus focus-visible:outline-none",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        />
      ))}
    </RadixSlider.Root>
  );
}
