"use client";

import { Select as RadixSelect } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export const Select = RadixSelect.Root;
export const SelectGroup = RadixSelect.Group;
export const SelectValue = RadixSelect.Value;

export function SelectTrigger({
  className,
  children,
  invalid,
  size = "md",
  ...props
}: React.ComponentProps<typeof RadixSelect.Trigger> & {
  invalid?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <RadixSelect.Trigger
      aria-invalid={invalid || undefined}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-md border border-border bg-surface text-fg",
        "transition-[border-color,box-shadow] duration-(--duration-fast) ease-(--ease-standard)",
        "hover:border-border-strong",
        "focus:border-border-focus focus:shadow-focus focus:outline-none",
        "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-fg-disabled",
        "aria-invalid:border-danger-500",
        "data-[placeholder]:text-fg-disabled",
        size === "sm" ? "h-[2.375rem] px-3 text-sm" : "h-11 px-3.5 text-base",
        className,
      )}
      {...props}
    >
      <span className="truncate-bn text-start">{children}</span>
      <RadixSelect.Icon asChild>
        <ChevronDown
          className="size-4 shrink-0 text-fg-tertiary transition-transform duration-(--duration-fast) data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </RadixSelect.Icon>
    </RadixSelect.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof RadixSelect.Content>) {
  return (
    <RadixSelect.Portal>
      <RadixSelect.Content
        position={position}
        sideOffset={6}
        className={cn(
          "relative z-50 max-h-72 min-w-(--radix-select-trigger-width) overflow-hidden",
          "rounded-lg border border-border bg-surface shadow-lg",
          "data-[state=open]:animate-(--animate-scale-in)",
          "data-[state=closed]:animate-(--animate-fade-out)",
          className,
        )}
        {...props}
      >
        <RadixSelect.Viewport className="p-1.5">{children}</RadixSelect.Viewport>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof RadixSelect.Item>) {
  return (
    <RadixSelect.Item
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-md py-2 pl-3 pr-8 text-sm text-fg",
        "outline-none data-highlighted:bg-surface-muted",
        "data-[state=checked]:font-medium",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      <RadixSelect.ItemIndicator className="absolute right-2.5">
        <Check className="size-4 text-teal-600" aria-hidden="true" />
      </RadixSelect.ItemIndicator>
    </RadixSelect.Item>
  );
}

export function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof RadixSelect.Label>) {
  return (
    <RadixSelect.Label
      className={cn("px-3 py-1.5 text-xs font-medium text-fg-tertiary", className)}
      {...props}
    />
  );
}

export function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof RadixSelect.Separator>) {
  return (
    <RadixSelect.Separator
      className={cn("my-1.5 h-px bg-border-subtle", className)}
      {...props}
    />
  );
}
