"use client";

import { ToggleGroup } from "radix-ui";
import { cn } from "@/lib/cn";

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

/**
 * Map/list toggle and similar two-or-three-way switches.
 *
 * Built on Radix ToggleGroup so arrow-key roving focus comes for free.
 * `type="single"` with no deselection — there is always exactly one view.
 */
export function SegmentedControl({
  options,
  value,
  onValueChange,
  size = "md",
  ariaLabel,
  className,
}: {
  options: SegmentedOption[];
  value: string;
  onValueChange: (value: string) => void;
  size?: "sm" | "md";
  ariaLabel: string;
  className?: string;
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      aria-label={ariaLabel}
      onValueChange={(next) => {
        if (next) onValueChange(next);
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-surface-muted p-1",
        className,
      )}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-sm font-medium whitespace-nowrap text-fg-tertiary",
            "transition-[background-color,color,box-shadow] duration-(--duration-fast)",
            "hover:text-fg",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
            "data-[state=on]:bg-surface data-[state=on]:text-fg data-[state=on]:shadow-xs",
            "[&_svg]:size-4 [&_svg]:shrink-0",
            size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-3.5 text-sm",
          )}
        >
          {option.icon}
          <span className="-translate-y-px">{option.label}</span>
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
