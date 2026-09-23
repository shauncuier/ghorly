import { cn } from "@/lib/cn";

/**
 * Consistent vertical rhythm across every marketing section, so the landing
 * page doesn't drift into ad-hoc padding values.
 */
export function Section({
  className,
  tone = "default",
  size = "md",
  ...props
}: React.ComponentProps<"section"> & {
  tone?: "default" | "muted" | "inverse";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <section
      className={cn(
        tone === "muted" && "bg-surface-muted",
        tone === "inverse" && "bg-ink-950 text-white",
        size === "sm" && "py-14 md:py-16",
        size === "md" && "py-16 md:py-24",
        size === "lg" && "py-20 md:py-32",
        className,
      )}
      {...props}
    />
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "start",
  inverse = false,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "start" | "center";
  inverse?: boolean;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        align === "center" && "md:flex-col md:items-center",
        className,
      )}
    >
      <div
        className={cn(
          "flex max-w-2xl flex-col gap-3",
          align === "center" && "items-center text-center",
        )}
      >
        {eyebrow && (
          // No uppercase / wide tracking here: Bangla has no uppercase, and
          // letter-spacing breaks the matra. Weight and colour do the work.
          <span
            className={cn(
              "text-sm font-semibold",
              inverse ? "text-teal-300" : "text-teal-700",
            )}
          >
            {eyebrow}
          </span>
        )}
        <h2
          className={cn(
            "text-3xl font-bold md:text-4xl",
            inverse ? "text-white" : "text-fg",
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              "text-lg",
              inverse ? "text-ink-300" : "text-fg-secondary",
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
