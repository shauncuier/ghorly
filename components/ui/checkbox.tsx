"use client";

import { Checkbox as RadixCheckbox } from "radix-ui";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/cn";

export function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof RadixCheckbox.Root>) {
  return (
    <RadixCheckbox.Root
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-[0.3rem] border border-border-strong bg-surface",
        "transition-[background-color,border-color] duration-(--duration-fast)",
        "hover:border-teal-600",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
        "data-[state=checked]:border-teal-600 data-[state=checked]:bg-teal-600",
        "data-[state=indeterminate]:border-teal-600 data-[state=indeterminate]:bg-teal-600",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadixCheckbox.Indicator className="text-white">
        {props.checked === "indeterminate" ? (
          <Minus className="size-3.5" strokeWidth={3} aria-hidden="true" />
        ) : (
          <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
        )}
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}

/** Checkbox plus label, wired together. The whole row is the hit target. */
export function CheckboxField({
  label,
  hint,
  className,
  ...props
}: React.ComponentProps<typeof RadixCheckbox.Root> & {
  label: string;
  hint?: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 py-1 select-none",
        props.disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <Checkbox className="mt-0.5" {...props} />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm text-fg">{label}</span>
        {hint && <span className="text-xs text-fg-tertiary">{hint}</span>}
      </span>
    </label>
  );
}
