"use client";

import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ARIA } from "@/lib/strings";

/**
 * A side or bottom sheet, built on Radix Dialog rather than a second library.
 * Used for mobile filter sheets, the mobile sidebar, and the admin
 * verification review panel.
 */

export const Drawer = Dialog.Root;
export const DrawerTrigger = Dialog.Trigger;
export const DrawerClose = Dialog.Close;

const SIDES = {
  right:
    "inset-y-0 right-0 h-full w-[min(26rem,calc(100vw-3rem))] border-l data-[state=open]:animate-(--animate-slide-in-right)",
  left: "inset-y-0 left-0 h-full w-[min(20rem,calc(100vw-3rem))] border-r data-[state=open]:animate-(--animate-slide-in-right)",
  bottom:
    "inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-xl border-t data-[state=open]:animate-(--animate-slide-in-bottom)",
} as const;

export interface DrawerContentProps extends React.ComponentProps<typeof Dialog.Content> {
  side?: keyof typeof SIDES;
  hideClose?: boolean;
}

export function DrawerContent({
  className,
  children,
  side = "right",
  hideClose = false,
  ...props
}: DrawerContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          "fixed inset-0 z-50 bg-overlay",
          "data-[state=open]:animate-(--animate-fade-in)",
          "data-[state=closed]:animate-(--animate-fade-out)",
        )}
      />
      <Dialog.Content
        className={cn(
          "fixed z-50 flex flex-col overflow-y-auto border-border bg-surface shadow-xl focus:outline-none",
          "data-[state=closed]:animate-(--animate-fade-out)",
          SIDES[side],
          className,
        )}
        {...props}
      >
        {side === "bottom" && (
          <span
            aria-hidden="true"
            className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-ink-200"
          />
        )}
        {children}
        {!hideClose && (
          <Dialog.Close
            aria-label={ARIA.closeDialog}
            className="absolute right-4 top-4 grid size-8 place-items-center rounded-md text-fg-tertiary transition-colors hover:bg-ink-100 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          >
            <X className="size-4" aria-hidden="true" />
          </Dialog.Close>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col gap-1 border-b border-border-subtle px-5 py-4 pr-14",
        className,
      )}
      {...props}
    />
  );
}

export function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof Dialog.Title>) {
  return (
    <Dialog.Title className={cn("text-base font-semibold text-fg", className)} {...props} />
  );
}

export function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof Dialog.Description>) {
  return (
    <Dialog.Description className={cn("text-sm text-fg-secondary", className)} {...props} />
  );
}

export function DrawerBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex-1 overflow-y-auto px-5 py-4", className)} {...props} />;
}

export function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-3 border-t border-border-subtle px-5 py-4",
        className,
      )}
      {...props}
    />
  );
}
