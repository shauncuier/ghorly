"use client";

import { Tabs as RadixTabs } from "radix-ui";
import { cn } from "@/lib/cn";

export const Tabs = RadixTabs.Root;

export function TabsList({
  className,
  variant = "underline",
  ...props
}: React.ComponentProps<typeof RadixTabs.List> & {
  variant?: "underline" | "pill";
}) {
  return (
    <RadixTabs.List
      data-variant={variant}
      className={cn(
        "flex items-center gap-1 overflow-x-auto",
        variant === "underline" && "border-b border-border",
        variant === "pill" && "w-fit rounded-md bg-surface-muted p-1",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  variant = "underline",
  ...props
}: React.ComponentProps<typeof RadixTabs.Trigger> & {
  variant?: "underline" | "pill";
}) {
  return (
    <RadixTabs.Trigger
      className={cn(
        "relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium",
        "transition-colors duration-(--duration-fast)",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        variant === "underline" && [
          "-mb-px border-b-2 border-transparent px-4 pb-3 pt-2 text-fg-tertiary",
          "hover:text-fg",
          "data-[state=active]:border-teal-600 data-[state=active]:text-fg",
        ],
        variant === "pill" && [
          "rounded-sm px-3.5 py-1.5 text-fg-tertiary",
          "hover:text-fg",
          "data-[state=active]:bg-surface data-[state=active]:text-fg data-[state=active]:shadow-xs",
        ],
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof RadixTabs.Content>) {
  return (
    <RadixTabs.Content
      className={cn(
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
        "data-[state=active]:animate-(--animate-fade-in)",
        className,
      )}
      {...props}
    />
  );
}
