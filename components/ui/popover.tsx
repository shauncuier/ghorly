"use client";

import { Popover as RadixPopover } from "radix-ui";
import { cn } from "@/lib/cn";

export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;
export const PopoverAnchor = RadixPopover.Anchor;
export const PopoverClose = RadixPopover.Close;

export function PopoverContent({
  className,
  sideOffset = 8,
  align = "start",
  ...props
}: React.ComponentProps<typeof RadixPopover.Content>) {
  return (
    <RadixPopover.Portal>
      <RadixPopover.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "z-50 w-72 rounded-lg border border-border bg-surface p-4 shadow-lg outline-none",
          "data-[state=open]:animate-(--animate-scale-in)",
          "data-[state=closed]:animate-(--animate-fade-out)",
          className,
        )}
        {...props}
      />
    </RadixPopover.Portal>
  );
}
