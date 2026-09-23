import { cn } from "@/lib/cn";
import { toBn } from "@/lib/format";

export interface ProgressProps {
  /** 0–100. */
  value: number;
  tone?: "accent" | "success" | "warning" | "danger";
  size?: "sm" | "md";
  label?: string;
  className?: string;
}

const TONE_FILL = {
  accent: "bg-teal-600",
  success: "bg-success-600",
  warning: "bg-warning-500",
  danger: "bg-danger-600",
} as const;

export function Progress({
  value,
  tone = "accent",
  size = "md",
  label,
  className,
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <div className="flex items-baseline justify-between gap-3 text-xs">
          <span className="text-fg-secondary">{label}</span>
          <span className="font-medium tabular text-fg">{toBn(Math.round(clamped))}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={cn(
          "w-full overflow-hidden rounded-full bg-ink-100",
          size === "sm" ? "h-1.5" : "h-2",
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-(--duration-slow) ease-(--ease-out-quint)",
            TONE_FILL[tone],
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
