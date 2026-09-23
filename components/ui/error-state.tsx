"use client";

import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { ACTIONS, ERRORS } from "@/lib/strings";

export interface ErrorStateProps {
  title?: string;
  body?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * The failure half of the query envelope. Every list that renders a skeleton
 * on `isLoading` renders this on `error`, so both paths exist from day one and
 * neither has to be retrofitted when the data comes from MongoDB.
 */
export function ErrorState({
  title = ERRORS.generic.title,
  body = ERRORS.generic.body,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="mb-1 grid size-14 place-items-center rounded-xl bg-danger-50 text-danger-600 [&_svg]:size-6"
      >
        <TriangleAlert />
      </span>
      <h3 className="text-lg font-semibold text-fg">{title}</h3>
      <p className="max-w-sm text-sm text-fg-secondary">{body}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}>
          {ACTIONS.tryAgain}
        </Button>
      )}
    </div>
  );
}
