"use client";

import { RadioGroup as RadixRadioGroup } from "radix-ui";
import { cn } from "@/lib/cn";

export const RadioGroup = RadixRadioGroup.Root;

export function RadioItem({
  className,
  ...props
}: React.ComponentProps<typeof RadixRadioGroup.Item>) {
  return (
    <RadixRadioGroup.Item
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-full border border-border-strong bg-surface",
        "transition-[border-color] duration-(--duration-fast)",
        "hover:border-teal-600",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
        "data-[state=checked]:border-teal-600",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadixRadioGroup.Indicator className="size-2.5 rounded-full bg-teal-600" />
    </RadixRadioGroup.Item>
  );
}

/**
 * A full-width selectable card. Used by the request wizard for urgency and
 * time-slot choices, where a bare radio would be a small target on mobile.
 */
export function RadioCard({
  value,
  label,
  hint,
  icon,
  className,
  disabled,
}: {
  value: string;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-4",
        "transition-[border-color,background-color,box-shadow] duration-(--duration-fast)",
        "hover:border-border-strong",
        "has-data-[state=checked]:border-teal-600 has-data-[state=checked]:bg-teal-50/60 has-data-[state=checked]:shadow-focus",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <RadioItem value={value} disabled={disabled} className="mt-0.5" />
      {icon && (
        <span
          aria-hidden="true"
          className="mt-px text-fg-tertiary [&_svg]:size-5 group-has-data-[state=checked]:text-teal-700"
        >
          {icon}
        </span>
      )}
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-fg">{label}</span>
        {hint && <span className="text-xs text-fg-secondary">{hint}</span>}
      </span>
    </label>
  );
}
