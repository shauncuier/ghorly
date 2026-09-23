import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Sizes run taller than a Latin-first system (38 / 44 / 52 instead of
 * 32 / 40 / 48). Bangla needs the vertical room: above-line vowel signs and
 * below-line conjunct parts both have to clear the box.
 *
 * Content is centred with flexbox, never with `line-height`, and the label
 * takes a 1px optical nudge because Bangla sits low in the em box.
 */
const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-md font-medium select-none",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-(--duration-fast) ease-(--ease-standard)",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:translate-y-px",
    "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        primary: "bg-teal-600 text-white shadow-xs hover:bg-teal-700 active:bg-teal-800",
        secondary:
          "bg-surface text-fg border border-border shadow-xs hover:bg-surface-muted hover:border-border-strong",
        subtle: "bg-ink-100 text-fg-secondary hover:bg-ink-200 hover:text-fg",
        ghost: "text-fg-secondary hover:bg-ink-100 hover:text-fg",
        danger: "bg-danger-600 text-white shadow-xs hover:bg-danger-700",
        inverse: "bg-ink-950 text-white shadow-xs hover:bg-ink-800",
        link: "text-fg-accent underline-offset-4 hover:underline h-auto! px-0! py-0!",
      },
      size: {
        sm: "h-[2.375rem] px-3.5 text-sm [&_svg]:size-4",
        md: "h-11 px-5 text-sm [&_svg]:size-4.5",
        lg: "h-13 px-7 text-base [&_svg]:size-5",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Shows a spinner and blocks interaction. The label stays in place so the button keeps its width. */
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  // Slot requires exactly one child, so the loading wrapper only exists on a
  // real <button>. A link rendered via asChild has no loading state anyway.
  if (asChild) {
    return (
      <Slot.Root
        className={cn(buttonVariants({ variant, size, block }), "pb-px", className)}
        {...props}
      >
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={disabled || loading}
      data-loading={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="absolute animate-spin" aria-hidden="true" />}
      <span
        className={cn(
          "inline-flex items-center gap-2 -translate-y-px",
          loading && "invisible",
        )}
      >
        {children}
      </span>
    </button>
  );
}

export { buttonVariants };
