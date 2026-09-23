"use client";

import { useSyncExternalStore } from "react";
import { CircleCheck, CircleX, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  dismissToast,
  getServerToasts,
  getToasts,
  subscribeToasts,
  type ToastTone,
} from "@/lib/toast";
import { ARIA } from "@/lib/strings";

const TONE: Record<
  ToastTone,
  { icon: React.ElementType; ring: string; iconColor: string }
> = {
  success: { icon: CircleCheck, ring: "border-success-500/30", iconColor: "text-success-600" },
  error: { icon: CircleX, ring: "border-danger-500/30", iconColor: "text-danger-600" },
  warning: { icon: TriangleAlert, ring: "border-warning-500/30", iconColor: "text-warning-600" },
  info: { icon: Info, ring: "border-border", iconColor: "text-teal-600" },
};

/**
 * Mounted once, in the root layout.
 *
 * `useSyncExternalStore` with a stable empty server snapshot means the server
 * renders an empty region and the first client render matches it exactly — no
 * hydration mismatch, even though the queue is module-level mutable state.
 */
export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getServerToasts);

  return (
    <div
      role="region"
      aria-label="নোটিফিকেশন"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-100 flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:top-0 sm:bottom-auto sm:items-end sm:p-6"
    >
      {/* Announced politely so a toast never interrupts what is being read. */}
      <div aria-live="polite" aria-atomic="false" className="contents">
        {toasts.map((t) => {
          const { icon: Icon, ring, iconColor } = TONE[t.tone];
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-surface p-4 shadow-lg",
                "animate-(--animate-slide-up)",
                ring,
              )}
            >
              <Icon className={cn("mt-0.5 size-5 shrink-0", iconColor)} aria-hidden="true" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-sm font-medium text-fg">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-fg-secondary">{t.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label={ARIA.closeDialog}
                className="-mr-1 -mt-1 grid size-7 shrink-0 place-items-center rounded-md text-fg-tertiary transition-colors hover:bg-ink-100 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
