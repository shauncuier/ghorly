import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { toBn } from "@/lib/format";

export interface StepperProps {
  steps: string[];
  /** Zero-based index of the step currently being edited. */
  current: number;
  className?: string;
}

/**
 * The request-wizard progress indicator.
 *
 * On mobile the labels collapse to a single "৩য় ধাপ · ৬টির মধ্যে" line plus a
 * bar — six Bangla labels will not fit at 375px, and shrinking them below 13px
 * would break the conjuncts.
 */
export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <div className={className}>
      {/* mobile */}
      <div className="flex flex-col gap-2 md:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold text-fg">{steps[current]}</span>
          <span className="text-xs tabular text-fg-tertiary">
            {toBn(current + 1)}/{toBn(steps.length)}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-teal-600 transition-[width] duration-(--duration-slow) ease-(--ease-out-quint)"
            style={{ width: `${((current + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* desktop */}
      <ol className="hidden items-start md:flex" aria-label="অগ্রগতি">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li
              key={step}
              className={cn("flex flex-1 flex-col gap-2", i === steps.length - 1 && "flex-none")}
              aria-current={active ? "step" : undefined}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors duration-(--duration-base)",
                    done && "bg-teal-600 text-white",
                    active && "bg-teal-600 text-white ring-4 ring-teal-100",
                    !done && !active && "bg-ink-100 text-fg-tertiary",
                  )}
                >
                  {done ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    <span className="tabular">{toBn(i + 1)}</span>
                  )}
                </span>
                {i < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-px flex-1 transition-colors duration-(--duration-base)",
                      done ? "bg-teal-600" : "bg-border",
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  "pr-4 text-xs",
                  active ? "font-semibold text-fg" : "text-fg-tertiary",
                )}
              >
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
