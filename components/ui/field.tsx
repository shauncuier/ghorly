"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";
import { Label } from "@/components/ui/label";

export interface FieldProps {
  label: string;
  /** Helper text shown under the control when there is no error. */
  hint?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
  /**
   * Receives the wiring every control needs. Spread it onto the input:
   * `<Field label="নাম">{(p) => <Input {...p} />}</Field>`
   */
  children: (props: {
    id: string;
    "aria-describedby": string | undefined;
    "aria-invalid": boolean | undefined;
    required: boolean | undefined;
  }) => React.ReactNode;
}

/**
 * Wires a label, hint and error message to a control with the right ids and
 * ARIA relationships, so no screen-reader plumbing has to be repeated across
 * the ~40 forms in the app.
 */
export function Field({
  label,
  hint,
  error,
  required,
  optional,
  className,
  children,
}: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} required={required} optional={optional}>
        {label}
      </Label>

      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        required: required || undefined,
      })}

      {error ? (
        <p id={errorId} className="text-xs text-danger-600">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-fg-tertiary">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
