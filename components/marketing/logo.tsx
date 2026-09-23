import Link from "next/link";
import { cn } from "@/lib/cn";
import { BRAND } from "@/lib/strings";

/**
 * The Ghorly mark.
 *
 * Two nested chevrons: the outer one reads as shelter, the inner as a second
 * party moving toward it — a home and the person coming to it. Deliberately
 * not a literal house outline, which is what every local directory uses.
 *
 * The wordmark is Latin (Inter) and carries `lang="en"` so a Bangla screen
 * reader doesn't try to pronounce it phonetically.
 */
export function LogoMark({
  className,
  inverse = false,
}: {
  className?: string;
  inverse?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8 shrink-0", className)}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.5 17.5 L16 6 L27.5 17.5"
        stroke={inverse ? "#ffffff" : "var(--teal-600)"}
        strokeWidth="3.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 26 L16 20.5 L21.5 26"
        stroke={inverse ? "var(--teal-300)" : "var(--teal-400)"}
        strokeWidth="3.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  href = "/",
  size = "md",
  inverse = false,
  className,
}: {
  href?: string;
  size?: "sm" | "md" | "lg";
  inverse?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={`${BRAND.bnName} — ${BRAND.tagline}`}
      className={cn(
        "inline-flex items-center gap-2 rounded-sm",
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-border-focus",
        className,
      )}
    >
      <LogoMark
        inverse={inverse}
        className={cn(size === "sm" && "size-7", size === "md" && "size-8", size === "lg" && "size-10")}
      />
      <span
        lang="en"
        className={cn(
          "font-latin font-bold tracking-[-0.01em]",
          inverse ? "text-white" : "text-ink-950",
          size === "sm" && "text-lg",
          size === "md" && "text-xl",
          size === "lg" && "text-2xl",
        )}
      >
        {BRAND.wordmark}
      </span>
    </Link>
  );
}
