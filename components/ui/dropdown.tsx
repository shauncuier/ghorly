"use client";

import { DropdownMenu } from "radix-ui";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export const Dropdown = DropdownMenu.Root;
export const DropdownTrigger = DropdownMenu.Trigger;
export const DropdownGroup = DropdownMenu.Group;

export function DropdownContent({
  className,
  sideOffset = 6,
  align = "end",
  ...props
}: React.ComponentProps<typeof DropdownMenu.Content>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "z-50 min-w-52 overflow-hidden rounded-lg border border-border bg-surface p-1.5 shadow-lg",
          "data-[state=open]:animate-(--animate-scale-in)",
          "data-[state=closed]:animate-(--animate-fade-out)",
          className,
        )}
        {...props}
      />
    </DropdownMenu.Portal>
  );
}

export function DropdownItem({
  className,
  danger,
  ...props
}: React.ComponentProps<typeof DropdownMenu.Item> & { danger?: boolean }) {
  return (
    <DropdownMenu.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-md px-3 py-2 text-sm outline-none",
        "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-tertiary",
        danger
          ? "text-danger-600 data-highlighted:bg-danger-50 [&_svg]:text-danger-600"
          : "text-fg data-highlighted:bg-surface-muted",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownCheckboxItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenu.CheckboxItem>) {
  return (
    <DropdownMenu.CheckboxItem
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-md py-2 pl-8 pr-3 text-sm text-fg outline-none",
        "data-highlighted:bg-surface-muted",
        className,
      )}
      {...props}
    >
      <DropdownMenu.ItemIndicator className="absolute left-2.5">
        <Check className="size-4 text-teal-600" aria-hidden="true" />
      </DropdownMenu.ItemIndicator>
      {children}
    </DropdownMenu.CheckboxItem>
  );
}

export function DropdownLabel({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenu.Label>) {
  return (
    <DropdownMenu.Label
      className={cn("px-3 py-1.5 text-xs font-medium text-fg-tertiary", className)}
      {...props}
    />
  );
}

export function DropdownSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenu.Separator>) {
  return (
    <DropdownMenu.Separator
      className={cn("my-1.5 h-px bg-border-subtle", className)}
      {...props}
    />
  );
}
