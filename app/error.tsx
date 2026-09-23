"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACTIONS, ERRORS } from "@/lib/strings";

/** Required by Next to be a client component. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-danger-50 text-danger-600">
        <TriangleAlert aria-hidden="true" className="size-8" />
      </span>
      <div className="flex max-w-md flex-col gap-3">
        <h1 className="text-3xl font-extrabold text-fg">{ERRORS.generic.title}</h1>
        <p className="text-base text-fg-secondary">{ERRORS.generic.body}</p>
        {error.digest && (
          <p className="font-latin text-xs text-fg-disabled" lang="en">
            {error.digest}
          </p>
        )}
      </div>
      <Button size="lg" onClick={reset}>
        {ACTIONS.tryAgain}
      </Button>
    </div>
  );
}
