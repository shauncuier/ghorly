"use client";

import { Accordion as RadixAccordion } from "radix-ui";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";

export const Accordion = RadixAccordion.Root;

export function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof RadixAccordion.Item>) {
  return (
    <RadixAccordion.Item
      className={cn("border-b border-border last:border-0", className)}
      {...props}
    />
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof RadixAccordion.Trigger>) {
  return (
    <RadixAccordion.Header className="flex">
      <RadixAccordion.Trigger
        className={cn(
          "group flex flex-1 items-start justify-between gap-4 py-5 text-start",
          "text-base font-medium text-fg transition-colors hover:text-fg-accent",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
          className,
        )}
        {...props}
      >
        {children}
        <Plus
          aria-hidden="true"
          className="mt-1 size-5 shrink-0 text-fg-tertiary transition-transform duration-(--duration-base) ease-(--ease-standard) group-data-[state=open]:rotate-45"
        />
      </RadixAccordion.Trigger>
    </RadixAccordion.Header>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof RadixAccordion.Content>) {
  return (
    <RadixAccordion.Content
      className={cn(
        "overflow-hidden",
        "data-[state=open]:animate-(--animate-accordion-down)",
        "data-[state=closed]:animate-(--animate-accordion-up)",
      )}
      {...props}
    >
      <div className={cn("pb-5 pr-10 text-base text-fg-secondary", className)}>
        {children}
      </div>
    </RadixAccordion.Content>
  );
}
