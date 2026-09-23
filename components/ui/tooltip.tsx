"use client";

import { Tooltip as RadixTooltip } from "radix-ui";
import { cn } from "@/lib/cn";

export const TooltipProvider = RadixTooltip.Provider;
export const Tooltip = RadixTooltip.Root;
export const TooltipTrigger = RadixTooltip.Trigger;

export function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: React.ComponentProps<typeof RadixTooltip.Content>) {
  return (
    <RadixTooltip.Portal>
      <RadixTooltip.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 max-w-64 rounded-md bg-ink-950 px-2.5 py-1.5 text-xs text-white shadow-lg",
          "data-[state=delayed-open]:animate-(--animate-fade-in)",
          className,
        )}
        {...props}
      >
        {children}
        <RadixTooltip.Arrow className="fill-ink-950" width={10} height={5} />
      </RadixTooltip.Content>
    </RadixTooltip.Portal>
  );
}

/** The common case: wrap a trigger, give it a Bangla label. */
export function SimpleTooltip({
  label,
  children,
  side = "top",
}: {
  label: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}
