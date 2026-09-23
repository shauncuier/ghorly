"use client";

import { Switch as RadixSwitch } from "radix-ui";
import { cn } from "@/lib/cn";

export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof RadixSwitch.Root>) {
  return (
    <RadixSwitch.Root
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border-2 border-transparent bg-ink-300",
        "transition-colors duration-(--duration-fast) ease-(--ease-standard)",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
        "data-[state=checked]:bg-teal-600",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadixSwitch.Thumb
        className={cn(
          "block size-5 rounded-full bg-white shadow-xs",
          "transition-transform duration-(--duration-fast) ease-(--ease-standard)",
          "data-[state=checked]:translate-x-5",
        )}
      />
    </RadixSwitch.Root>
  );
}

/** Switch with a label and optional hint, laid out as a settings row. */
export function SwitchField({
  label,
  hint,
  className,
  ...props
}: React.ComponentProps<typeof RadixSwitch.Root> & {
  label: string;
  hint?: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-6 py-2 select-none",
        props.disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-fg">{label}</span>
        {hint && <span className="text-xs text-fg-secondary">{hint}</span>}
      </span>
      <Switch {...props} />
    </label>
  );
}
