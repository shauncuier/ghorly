"use client";

import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ARIA } from "@/lib/strings";

/**
 * Radix Dialog gives us the focus trap, the ESC handler, scroll locking and
 * `aria-modal` wiring for free. Exit animations work because Radix keeps the
 * node mounted while `data-state="closed"` plays.
 */

export const Modal = Dialog.Root;
export const ModalTrigger = Dialog.Trigger;
export const ModalClose = Dialog.Close;

const SIZES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

export interface ModalContentProps extends React.ComponentProps<typeof Dialog.Content> {
  size?: keyof typeof SIZES;
  /** Hide the default corner close button (when the footer already has one). */
  hideClose?: boolean;
}

export function ModalContent({
  className,
  children,
  size = "md",
  hideClose = false,
  ...props
}: ModalContentProps) {
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
          "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2",
          "max-h-[calc(100vh-4rem)] overflow-y-auto",
          "rounded-xl border border-border bg-surface shadow-xl",
          "focus:outline-none",
          "data-[state=open]:animate-(--animate-scale-in)",
          "data-[state=closed]:animate-(--animate-scale-out)",
          SIZES[size],
          className,
        )}
        {...props}
      >
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

export function ModalHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 px-6 pt-6 pb-4 pr-14", className)} {...props} />;
}

export function ModalTitle({
  className,
  ...props
}: React.ComponentProps<typeof Dialog.Title>) {
  return (
    <Dialog.Title className={cn("text-lg font-semibold text-fg", className)} {...props} />
  );
}

export function ModalDescription({
  className,
  ...props
}: React.ComponentProps<typeof Dialog.Description>) {
  return (
    <Dialog.Description
      className={cn("text-sm text-fg-secondary", className)}
      {...props}
    />
  );
}

export function ModalBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export function ModalFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-3 border-t border-border-subtle px-6 py-4 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}
